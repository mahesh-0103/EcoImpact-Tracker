import express from 'express';
import { WebClient } from '@slack/web-api';
import axios from 'axios'; // For token refresh
import dotenv from 'dotenv';
import tokenStore from '../services/tokenStore.js';

dotenv.config();
const router = express.Router();

/**
 * Refreshes an expired Slack access token using the refresh token.
 * @param {string} refreshToken - The refresh token for Slack.
 * @returns {Promise<object>} The new token data from Slack.
 */
async function refreshSlackToken(refreshToken) {
  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      refresh_token: refreshToken,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.data.ok) {
      throw new Error(response.data.error || 'Failed to refresh token');
    }
    return response.data;
  } catch (error) {
    console.error('Error refreshing Slack token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Retrieves a valid Slack token for the user, refreshing it if it's expired.
 * @param {string} userId - The user's unique identifier.
 * @returns {Promise<string|null>} A valid access token, or null if not available.
 */
async function getValidSlackTokenForUser(userId) {
  const tokenInfo = await tokenStore.getToken(userId, 'slack');
  if (!tokenInfo) return null;

  const isExpired = tokenInfo.expiresAt && new Date(tokenInfo.expiresAt) < new Date();

  if (isExpired) {
    if (tokenInfo.refreshToken) {
      try {
        const refreshedData = await refreshSlackToken(tokenInfo.refreshToken);
        
        // Save the new token details to the store
        await tokenStore.saveToken(userId, 'slack', {
          accessToken: refreshedData.access_token,
          refreshToken: refreshedData.refresh_token, // Slack may issue a new refresh token
          expiresAt: Date.now() + (refreshedData.expires_in * 1000),
        });
        
        return refreshedData.access_token;
      } catch (refreshError) {
        console.error(`Failed to refresh token for user ${userId}. They may need to re-authenticate.`);
        // If refresh fails, the token is invalid. Delete it to force re-auth.
        await tokenStore.deleteToken(userId, 'slack');
        return null;
      }
    } else {
      // Token is expired and there is no refresh token.
      await tokenStore.deleteToken(userId, 'slack');
      return null;
    }
  }

  return tokenInfo.accessToken;
}

// GET /channels - list channels
router.get('/channels', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const token = await getValidSlackTokenForUser(userId);
    if (!token) {
      return res.status(401).json({ error: 'Slack not connected or token is invalid.' });
    }

    const slack = new WebClient(token);
    const result = await slack.conversations.list({ types: 'public_channel,private_channel', limit: 100 });

    return res.json({ channels: result.channels || [] });
  } catch (err) {
    console.error('Slack channels error:', err?.data || err.message);
    const code = err?.data?.error;
    if (code === 'invalid_auth' || code === 'not_authed' || code === 'token_revoked') {
      return res.status(401).json({ error: 'Slack authentication failed', details: err.data });
    }
    return res.status(500).json({ error: 'Failed to fetch Slack channels', details: err.data });
  }
});

// POST /send-message - send a chat message
router.post('/send-message', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  const { channel, text } = req.body;
  if (!channel || !text) return res.status(400).json({ error: 'Missing channel or text' });

  try {
    const token = await getValidSlackTokenForUser(userId);
    if (!token) {
      return res.status(401).json({ error: 'Slack not connected or token is invalid.' });
    }

    const slack = new WebClient(token);
    const response = await slack.chat.postMessage({ channel, text });

    return res.json({ success: true, ts: response.ts, channel: response.channel, ok: response.ok });
  } catch (err) {
    console.error('Slack send message error:', err?.data || err.message);
    const code = err?.data?.error;
    if (code === 'invalid_auth' || code === 'not_authed' || code === 'token_revoked') {
      return res.status(401).json({ error: 'Slack authentication failed', details: err.data });
    }
    return res.status(500).json({ error: 'Failed to send Slack message', details: err.data });
  }
});


// GET /status - integration status using token store metadata
router.get('/status', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ isConnected: false });

  const token = await tokenStore.getToken(userId, 'slack');
  const isConnected = !!token?.accessToken;

  // Optional: You could do a live check here, but it's slower.
  // For a fast status check, just seeing if a token exists is usually enough.
  res.json({ isConnected });
});

export default router;
