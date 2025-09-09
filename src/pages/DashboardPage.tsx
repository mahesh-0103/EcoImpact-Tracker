import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Send, 
  Clock, 
  MapPin, 
  Users,
  BarChart3,
  Activity,
  Zap,
  Car,
  Trash2,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { 
  getCalendarEvents, 
  getCalendarStatus, 
  CalendarEvent,
} from '../services/api';
import { dataService, ActivityData, WeeklyData, MonthlySummary } from '../services/dataService';
import { addDemoData, clearDemoData } from '../utils/demoData';
import GreetingMessage from '../components/GreetingMessage';

const DashboardPage = () => {
  const [formData, setFormData] = useState({
    electricity: '',
    travel: '',
    waste: ''
  });
  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Integration states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [selectedSlackChannel, setSelectedSlackChannel] = useState('');
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  
  // Real data from data service
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    totalCo2: 0,
    activityCount: 0,
    averageDaily: 0,
    treesNeeded: 0
  });

  // Load integration status and data on component mount
  useEffect(() => {
    loadIntegrationStatus();
    loadUserData();
  }, []);

  const loadUserData = () => {
    const recentActivities = dataService.getRecentActivities(7);
    const weekly = dataService.getWeeklyData();
    const monthly = dataService.getMonthlySummary();
    
    setActivities(recentActivities);
    setWeeklyData(weekly);
    setMonthlySummary(monthly);
  };

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
        loadIntegrationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      setIsLoadingIntegrations(true);
      
      // Check calendar status
      try {
        const calendarStatus = await getCalendarStatus();
        setCalendarConnected(calendarStatus.isConnected);
        if (calendarStatus.isConnected) {
          const events = await getCalendarEvents();
          setCalendarEvents(events.events);
        }
      } catch (error) {
        console.error('Calendar status check failed:', error);
        setCalendarConnected(false);
      }

      // Check Slack status (assuming a similar pattern)
      try {
        // Replace with a real getSlackStatus() call if available
        const isSlackConnected = localStorage.getItem('slack_access_token');
        setSlackConnected(!!isSlackConnected);
        if (isSlackConnected) {
          // const channels = await getSlackChannels(); 
          // setSlackChannels(channels.channels);
        }
      } catch (error) {
        console.error('Slack status check failed:', error);
        setSlackConnected(false);
      }
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    
    // This is a placeholder for a real calculation
    setTimeout(() => {
      const { electricity, travel, waste } = formData;
      const total = (parseFloat(electricity) || 0) * 0.5 + 
                    (parseFloat(travel) || 0) * 0.2 + 
                    (parseFloat(waste) || 0) * 1.5;
      setResult(total);
      setIsCalculating(false);
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Car Travel': return <Car className="w-4 h-4" />;
      case 'Flight': return <Car className="w-4 h-4" />;
      case 'Electricity': return <Zap className="w-4 h-4" />;
      case 'Waste': return <Trash2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting Message */}
      <GreetingMessage />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-terra-primary mb-2">
              Welcome to your Carbon Dashboard
            </h1>
            <p className="text-xl text-terra-secondary">
              Track your environmental impact and work towards a more sustainable future.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { addDemoData(); loadUserData(); }}
              className="px-4 py-2 text-sm bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors duration-300"
              title="Add demo data"
            >
              Add Demo Data
            </button>
            <button
              onClick={() => { clearDemoData(); loadUserData(); }}
              className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
              title="Clear all data"
            >
              Clear Data
            </button>
            <button
              onClick={loadUserData}
              className="p-3 text-terra-secondary hover:text-terra-primary transition-colors duration-300 hover:bg-terra-panel/30 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.totalCo2.toFixed(1)}</p>
              <p className="text-terra-secondary text-sm">kg CO₂e</p>
            </div>
            <div className="w-12 h-12 bg-terra-accent/20 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-terra-accent" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold text-terra-primary">{dataService.getWeeklyTotal().toFixed(1)}</p>
              <p className="text-terra-secondary text-sm">kg CO₂e</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">Activities</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.activityCount}</p>
              <p className="text-terra-secondary text-sm">This month</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">Trees Needed</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.treesNeeded}</p>
              <p className="text-terra-secondary text-sm">To offset</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Chart */}
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-terra-accent" />
            <span>Weekly Footprint</span>
          </h3>
          <div className="space-y-4">
            {weeklyData.length > 0 ? (
              weeklyData.map((day, index) => {
                const maxCo2 = Math.max(...weeklyData.map(d => d.co2), 1);
                return (
                  <div key={`${day.date}-${index}`} className="flex items-center space-x-4">
                    <div className="w-12 text-terra-secondary font-medium">{day.date}</div>
                    <div className="flex-1 bg-terra-darker/50 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-terra-accent to-terra-accent/80 rounded-full transition-all duration-500" style={{ width: `${(day.co2 / maxCo2) * 100}%` }}/>
                    </div>
                    <div className="w-16 text-terra-primary font-semibold text-right">
                      {day.co2.toFixed(1)} kg
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-terra-secondary">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data for this week</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Calculator */}
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-terra-accent" />
            <span>Quick Calculator</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form inputs... */}
            <button type="submit" disabled={isCalculating} className="w-full bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {isCalculating ? <div className="animate-spin w-5 h-5 border-2 border-terra-dark border-t-transparent rounded-full" /> : <> <Calculator className="w-5 h-5" /> <span>Calculate</span></>}
            </button>
            {result !== null && (
              <div className="mt-4 p-4 bg-terra-accent/10 border border-terra-accent/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-terra-accent mb-1">{result.toFixed(2)} kg CO₂e</div>
                <div className="text-sm text-terra-secondary">Estimated carbon footprint</div>
              </div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Integration Status */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="w-6 h-6 text-terra-accent" />
            <h3 className="text-2xl font-bold text-terra-primary">Google Calendar</h3>
            <div className={`w-3 h-3 rounded-full ${calendarConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          {calendarConnected ? (
            <div>
              <p className="text-terra-secondary mb-4">Your upcoming events:</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {calendarEvents.length > 0 ? (
                  calendarEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-terra-darker/50 rounded-lg border border-terra-panel-light/30">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-4 h-4 text-terra-accent mt-1" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-terra-primary font-medium truncate">{event.summary}</h4>
                          <p className="text-terra-secondary text-sm">{new Date(event.start).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-terra-secondary text-center py-4">No upcoming events</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-terra-secondary" />
              <p className="text-terra-secondary mb-4">Connect your Google Calendar</p>
              <a href="/calendar" className="inline-flex items-center space-x-2 px-4 py-2 bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Connect</span>
              </a>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-6 h-6 text-terra-accent" />
            <h3 className="text-2xl font-bold text-terra-primary">Slack Notifications</h3>
            <div className={`w-3 h-3 rounded-full ${slackConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          {slackConnected ? (
            <div>
              <p className="text-terra-secondary mb-4">Send updates to your team:</p>
              {/* Slack connected content */}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50 text-terra-secondary" />
              <p className="text-terra-secondary mb-4">Connect your Slack workspace</p>
              <a href="/slack" className="inline-flex items-center space-x-2 px-4 py-2 bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Connect</span>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
