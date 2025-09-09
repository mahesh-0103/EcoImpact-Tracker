
import express from 'express';
import { exchangeCodeForToken, getAuthUrl } from '../services/google-calendar.js';
import tokenStore from '../services/tokenStore.js';
import { decode, encode } from 'js-base64';

const router = express.Router();

// Generate the Google Auth URL
router.get('/google/url', (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    // We need to pass the user ID to the callback, so we encode it in the state
    const encodedUserId = encode(userId);
    const authUrl = getAuthUrl(encodedUserId);
    res.json({ authUrl });
});

// The final step of the OAuth2 flow.
// Google redirects the user here after they have granted permission.
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code is required.');
  }

  // The 'state' parameter should contain the user ID to associate the token with.
  // It was encoded in Base64 on the client-side to prevent tampering.
  let userId;
  try {
    userId = decode(state);
    if (!userId) throw new Error('Decoded state is empty');
  } catch (e) {
    console.error('Invalid or missing state parameter:', e.message);
    return res.status(400).send('Invalid state parameter. Could not identify user.');
  }
  
  try {
    // Exchange the authorization code for an access token and a refresh token
    const tokenData = await exchangeCodeForToken(code);

    if (!tokenData.access_token || !tokenData.refresh_token) {
        console.error('Token exchange failed. Response from Google:', tokenData);
        return res.status(500).send('Failed to retrieve a valid token set from Google.');
    }

    // Save the new token data. Crucially, this includes the refresh_token.
    await tokenStore.saveToken(userId, 'google', {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      // The expiry_date is a unix timestamp (milliseconds) from the googleapis library
      expiresAt: tokenData.expiry_date, 
      scope: tokenData.scope,
    });

    // Redirect the user back to the calendar page in the frontend.
    res.redirect('/calendar');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('An error occurred during the authentication process.');
  }
});

export default router;
