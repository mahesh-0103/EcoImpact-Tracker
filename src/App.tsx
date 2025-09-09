import { useEffect } from 'react';
import { useSession } from '@descope/react-sdk';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalculatorPage from './pages/CalculatorPage';
import CalendarPage from './pages/CalendarPage';
import SlackPage from './pages/SlackPage';
import ProfilePage from './pages/ProfilePage';
import AuthDebugger from './components/AuthDebugger';

// A component to handle protected routes
const ProtectedRoutes = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  const { isAuthenticated, isSessionLoading } = useSession();

  // Debug logging
  useEffect(() => {
    console.log('Auth Debug:', {
      isAuthenticated,
      isSessionLoading,
    });
  }, [isAuthenticated, isSessionLoading]);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-terra-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-terra-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-terra-dark">
        <AnimatePresence mode="wait">
          <Routes>
            {isAuthenticated ? (
              // Protected routes
              <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/slack" element={<SlackPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Redirect any other authenticated path to the dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            ) : (
              // Public routes
              <>
                <Route path="/login" element={<LoginPage />} />
                {/* Redirect any other non-authenticated path to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </Routes>
        </AnimatePresence>
        <AuthDebugger />
      </div>
    </Router>
  );
}

export default App;
