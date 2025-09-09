import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import BackNavigation from '../components/BackNavigation';
import SlackIntegration from '../components/SlackIntegration';

const SlackPage = () => {
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    // checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // const status = await getSlackStatus();
      // setIsConnected(!!status.connected);
    } catch (error) {
      console.error('Error checking Slack connection:', error);
      // If we get a 401, it might mean the stored token is bad, so we reflect that
      if ((error as { response?: { status: number } })?.response?.status === 401) {
        setIsConnected(false);
        onConnectionChange(false);
      }
    }
  };

  const onConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    // Persist a simple flag to avoid re-running the full connection flow on every page load
    // The actual token is handled by the Descope SDK and our backend
    localStorage.setItem('slack-connected', connected.toString());
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
              <MessageSquare className="w-10 h-10 text-terra-accent" />
              <span>Slack Notifications</span>
            </h1>
            <p className="text-xl text-terra-secondary">
              Configure Slack notifications to keep your team updated on environmental impact tracking.
            </p>
          </div>
          
          {/* no refresh UI needed */}
        </div>
      </motion.div>

      {/* Slack Integration */}
      <SlackIntegration 
        isConnected={isConnected} 
        onConnectionChange={onConnectionChange} 
      />
    </div>
  );
};

export default SlackPage;
