
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle } from 'lucide-react';
import BackNavigation from '../components/BackNavigation';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import { getCalendarStatus } from '../services/api';
import { AxiosError } from 'axios';
import { useSession } from '@descope/react-sdk';

const CalendarPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sessionToken } = useSession();

  // Check connection status on component mount
  useEffect(() => {
    if (sessionToken) {
      checkConnectionStatus();
    }
  }, [sessionToken]);

  const checkConnectionStatus = async () => {
    if (!sessionToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const status = await getCalendarStatus(sessionToken);
      setIsConnected(status.isConnected);
    } catch (err) {
      console.error('Error checking calendar connection:', err);
      setIsConnected(false); // Ensure we show the disconnected state on error
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setError("Your session might be invalid or your calendar is disconnected. Please try connecting.");
        } else if (err.response?.status === 503) {
          setError("A server-side permission error occurred. The service account is missing the \"Cloud KMS CryptoKey Encrypter/Decrypter\" role. Please check your Google Cloud IAM configuration.");
        } else if (err.response?.status >= 500) {
          setError("A server-side error occurred. Please try again later.");
        } else {
          setError("An unexpected error occurred while checking your calendar connection.");
        }
      } else {
        setError("An unexpected error occurred while checking your calendar connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    // If connection is successful, clear any previous errors
    if (connected) {
      setError(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-terra-secondary">Checking calendar connection...</div>;
    }

    return (
      <>
        {error && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center space-x-3"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}
        <GoogleCalendarIntegration 
          isConnected={isConnected} 
          onConnectionChange={handleConnectionChange} 
        />
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Navigation */}
      <BackNavigation />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-terra-primary mb-2 flex items-center space-x-3">
              <Calendar className="w-10 h-10 text-terra-accent" />
              <span>Calendar Integration</span>
            </h1>
            <p className="text-xl text-terra-secondary">
              View your upcoming events and track your environmental impact through calendar activities.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Google Calendar Integration Content */}
      {renderContent()}
    </div>
  );
};

export default CalendarPage;
