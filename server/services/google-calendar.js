
import { google } from 'googleapis';
import tokenStore from './tokenStore.js';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

// This is the heart of the Google API integration
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// --- Functions to be used by the routes --- 

/**
 * Generates a URL that asks for permission to access the user's Google Calendar.
 * @param {string} userId - The unique ID of the user.
 * @returns {string} The authorization URL.
 */
export function getAuthUrl(userId) {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    // The 'state' parameter is a way to pass data through the auth flow.
    // We are passing the userId to associate the token with the correct user.
    state: userId,
    prompt: 'consent', // This forces the consent screen to appear every time
  });
}

/**
 * Exchanges an authorization code for an access token and refresh token.
 * @param {string} code - The authorization code from the Google callback.
 * @returns {Promise<object>} The token data from Google.
 */
export async function exchangeCodeForToken(code) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Creates a Google Calendar API client with the given access token.
 * @param {string} accessToken - The user's Google access token.
 * @returns {object} An authenticated Google Calendar API client.
 */
export function getClient(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Uses a refresh token to get a new access token.
 * @param {string} refreshToken - The user's Google refresh token.
 * @returns {Promise<object>} The new token data.
 */
export async function refreshToken(refreshTokenValue) {
    oauth2Client.setCredentials({ refresh_token: refreshTokenValue });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}
