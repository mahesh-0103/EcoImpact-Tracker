
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, AlertCircle, ExternalLink, Plus, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent, CalendarEvent, getGoogleAuthUrl } from '../services/api';
import { useSession } from '@descope/react-sdk';

interface GoogleCalendarIntegrationProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const GoogleCalendarIntegration = ({ isConnected, onConnectionChange }: GoogleCalendarIntegrationProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar management state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventForm, setEventForm] = useState({ 
    summary: '', 
    startTime: '', 
    endTime: '', 
    location: '' 
  });
  const [formStatus, setFormStatus] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // We need the Descope session token to make authenticated API calls to our backend
  const { sessionToken } = useSession();

  // Fetch events when connected
  const fetchEvents = async () => {
    if (!sessionToken) return;

    setIsLoadingEvents(true);
    setError(null);
    try {
      console.log('Fetching calendar events...');
      const response = await getCalendarEvents(sessionToken);
      
      if (!response || !response.events) {
        throw new Error('Invalid response from Calendar API');
      }
      
      setEvents(response.events);
    } catch (err: unknown) {
      console.error('Failed to fetch calendar events:', err);
      const errorMessage = (err as Record<string, { response: { data: { message: string } } }>)?.response?.data?.message || (err as Error)?.message || 'Unknown error';
      
      setError(`Could not load your calendar events: ${errorMessage}. Please ensure you are connected to Google Calendar.`);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isConnected && sessionToken) {
      fetchEvents();
    }
  }, [isConnected, sessionToken]);

  const handleConnectClick = async () => {
    if (!sessionToken) {
      setError('You must be logged in to connect your calendar.');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Get the Google Auth URL from our backend
      const { authUrl } = await getGoogleAuthUrl(sessionToken);
      
      // 2. Redirect the user to Google's consent screen
      window.location.href = authUrl;

      // The user will be redirected to our backend callback, which then redirects back to the calendar page.
      // The `onConnectionChange` and `fetchEvents` will be triggered by the parent component's `checkConnectionStatus`.
    } catch (err) {
      console.error('Failed to get Google Auth URL:', err);
      setError('Failed to start the connection process. Please try again.');
      setIsConnecting(false);
    }
  };


  const handleDisconnect = () => {
    // For now, a simple disconnect is to just update the state.
    // A full implementation would involve revoking the token on the backend.
    setEvents([]);
    onConnectionChange(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      setFormStatus('Authentication session expired. Please refresh the page.');
      return;
    }

    if (!eventForm.summary || !eventForm.startTime || !eventForm.endTime) {
      setFormStatus('Title, start time, and end time are required.');
      return;
    }
    
    const startDate = new Date(eventForm.startTime);
    const endDate = new Date(eventForm.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      setFormStatus('Please enter a valid start and end time.');
      return;
    }
    
    setIsCreating(true);
    setFormStatus('Creating event...');
    
    try {
      await createCalendarEvent({
        summary: eventForm.summary,
        location: eventForm.location,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      }, sessionToken);
      
      setFormStatus('Event created successfully!');
      setEventForm({ summary: '', startTime: '', endTime: '', location: '' });
      fetchEvents(); // Refresh the event list
    } catch (err: unknown) {
      console.error('Failed to create event:', err);
      const errorMessage = (err as Record<string, { response: { data: { message: string } } }>)?.response?.data?.message || (err as Error)?.message || 'Unknown error occurred';
      setFormStatus(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  // --- Render Functions ---

  if (isConnected) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-green-400" /> <h3 className="text-xl font-bold text-green-400">Google Calendar Connected</h3></div>
          <div className="flex items-center space-x-3">
            <button onClick={fetchEvents} disabled={isLoadingEvents} className="p-2 text-green-400 hover:text-green-300 transition-colors duration-300 hover:bg-green-500/20 rounded-lg" title="Refresh events">
              <RefreshCw className={`w-5 h-5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleDisconnect} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300">Disconnect</button>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2"><Plus className="w-5 h-5" /> <span>Create New Event</span></h4>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input type="text" value={eventForm.summary} onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })} placeholder="Event Title" className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none" required />
                <input type="datetime-local" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none" required />
              </div>
              <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Location (optional)" className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none" />
              <button type="submit" disabled={isCreating} className="w-full px-4 py-3 bg-green-600/30 hover:bg-green-600/40 text-green-200 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {isCreating ? <div className="animate-spin w-5 h-5 border-2 border-green-200 border-t-transparent rounded-full" /> : <><Calendar className="w-5 h-5" /> <span>Create Event</span></>}
              </button>
              {formStatus && <p className={`text-sm ${formStatus.includes('successfully') ? 'text-green-300' : 'text-red-400'}`}>{formStatus}</p>}
            </form>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2"><Calendar className="w-5 h-5" /> <span>Upcoming Events</span></h4>
            {isLoadingEvents ? <div className="text-center py-8"><div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-green-200">Loading events...</p></div> : error ? <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"><div className="flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-red-400" /> <span className="text-red-400 text-sm">{error}</span></div></div> : events.length === 0 ? <div className="text-center py-8 text-green-200"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /> <p>No upcoming events found</p></div> : <div className="space-y-3 max-h-96 overflow-y-auto">{events.map((event) => <div key={event.id} className="p-4 bg-green-900/30 rounded-lg border border-green-500/30"><div className="flex items-start space-x-3"><Clock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" /> <div className="flex-1 min-w-0"><h5 className="font-semibold text-green-100 truncate">{event.summary}</h5><p className="text-sm text-green-300">{new Date(event.start).toLocaleString()}</p>{event.location && <div className="flex items-center space-x-1 mt-1"><MapPin className="w-3 h-3 text-green-400" /> <span className="text-xs text-green-300 truncate">{event.location}</span></div>}{event.attendees > 0 && <div className="flex items-center space-x-1 mt-1"><Users className="w-3 h-3 text-green-400" /> <span className="text-xs text-green-300">{event.attendees} attendees</span></div>}</div></div></div>)}</div>}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center space-x-3 mb-4"><Calendar className="w-6 h-6 text-terra-accent" /> <h3 className="text-xl font-bold text-terra-primary">Connect Google Calendar</h3></div>
      <p className="text-terra-secondary mb-6">Connect your Google Calendar to automatically track your environmental impact from your scheduled events and activities.</p>
      {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-red-400" /> <span className="text-red-400 text-sm">{error}</span></motion.div>}
      <div className="space-y-4">
        <div className="p-4 bg-terra-darker/50 rounded-lg">
          <h4 className="text-terra-primary font-medium mb-2">What you'll get:</h4>
          <ul className="text-terra-secondary text-sm space-y-1">
            <li>• View upcoming events in your dashboard</li>
            <li>• Create new calendar events directly from the app</li>
            <li>• Automatic carbon footprint calculation for travel events</li>
          </ul>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-terra-secondary text-sm"><ExternalLink className="w-4 h-4" /> <span>Secure connection via Google OAuth</span></div>
          <button onClick={handleConnectClick} disabled={isConnecting} className="px-6 py-3 bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            {isConnecting ? <div className="animate-spin w-5 h-5 border-2 border-terra-dark border-t-transparent rounded-full" /> : <><Calendar className="w-5 h-5" /> <span>Connect Calendar</span></>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GoogleCalendarIntegration;
