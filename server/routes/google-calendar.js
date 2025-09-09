
import express from 'express';
import { getClient, refreshToken } from '../services/google-calendar.js';
import tokenStore from '../services/tokenStore.js';

const router = express.Router();

// A helper function to get a valid token, refreshing if necessary
async function getValidToken(userId) {
  const token = await tokenStore.getToken(userId, 'google');
  if (!token) return null;

  // If the token has an expiration and it's in the past, try to refresh it.
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    if (token.refreshToken) {
      try {
        const refreshedToken = await refreshToken(token.refreshToken);
        // Important: Save the new token (and possibly the new refresh token)
        await tokenStore.saveToken(userId, 'google', {
          ...token, // carry over original data
          accessToken: refreshedToken.access_token,
          // Correctly use the expiry_date from the googleapis library response
          expiresAt: refreshedToken.expiry_date,
          // Google might issue a new refresh token
          refreshToken: refreshedToken.refresh_token || token.refreshToken,
        });
        return await tokenStore.getToken(userId, 'google');
      } catch (error) {
        console.error('Failed to refresh Google token:', error);
        return null; // Can't refresh, so it's invalid.
      }
    }
    return null; // Expired and no refresh token.
  }
  return token;
}

// GET /api/calendar/status - Check for a valid token.
router.get('/status', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const googleToken = await getValidToken(userId);

  if (googleToken?.accessToken) {
    // Final check to ensure the token works
    try {
      const calendar = getClient(googleToken.accessToken);
      await calendar.calendarList.list({ maxResults: 1 });
      return res.json({ isConnected: true });
    } catch (e) {
      console.warn('Token validation API call failed even after refresh logic:', e.message);
      return res.status(401).json({ isConnected: false, error: 'Token is invalid or expired.' });
    }
  }

  // If we get here, no valid token was available.
  return res.status(401).json({
    isConnected: false,
    error: 'Google Calendar not connected or token is invalid.',
    details: 'No valid Google access token was found or could be refreshed for the user.',
    debug_token_info: req.user?._rawDescopeToken || 'Raw Descope token not found on request object.',
  });
});

// GET /api/calendar/events - Fetch calendar events
router.get('/events', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const googleToken = await getValidToken(userId);
  if (!googleToken || !googleToken.accessToken) {
    return res.status(401).json({ error: 'Google Calendar not connected or token is invalid.' });
  }

  try {
    const calendar = getClient(googleToken.accessToken);
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required query parameters: start and end' });
    }

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(events.data.items || []);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
  }
});

export default router;
