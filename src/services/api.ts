
import axios from 'axios';

// Define the base URL. The Vite proxy will handle rewriting this to the target in development.
const API_URL = '/api';

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Types ---

export interface CalendarStatus {
  isConnected: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  attendees: number;
}

export interface NewCalendarEvent {
  summary: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

export interface SlackChannel {
    id: string;
    name: string;
    is_member: boolean;
    is_private: boolean;
    num_members: number;
}

export interface SlackMessage {
    channel: string;
    text: string;
}

// --- Helper for Auth ---

const authHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


// --- API Functions ---

/**
 * Gets the Google authentication URL from the backend.
 */
export const getGoogleAuthUrl = async (token: string): Promise<{ authUrl: string }> => {
    const response = await api.get('/auth/google/url', authHeaders(token));
    return response.data;
};


/**
 * Checks if the user's Google Calendar is connected.
 */
export const getCalendarStatus = async (token: string): Promise<CalendarStatus> => {
  const response = await api.get('/calendar/status', authHeaders(token));
  return response.data;
};

/**
 * Gets calendar events from the backend.
 */
export const getCalendarEvents = async (token: string): Promise<{ events: CalendarEvent[] }> => {
  const response = await api.get('/calendar/events', authHeaders(token));
  return response.data;
};

/**
 * Creates a new calendar event.
 */
export const createCalendarEvent = async (event: NewCalendarEvent, token: string): Promise<void> => {
  await api.post('/calendar/events', event, authHeaders(token));
};

/**
* Gets available Slack channels from the backend.
*/
export const getSlackChannels = async (token: string): Promise<{ channels: SlackChannel[] }> => {
    const response = await api.get('/slack/channels', authHeaders(token));
    return response.data;
};

/**
* Sends a message to a Slack channel.
*/
export const sendSlackMessage = async (message: SlackMessage, token: string): Promise<void> => {
    await api.post('/slack/message', message, authHeaders(token));
};
