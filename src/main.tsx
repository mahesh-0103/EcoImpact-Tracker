import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@descope/react-sdk';
import App from './App.tsx';
import './index.css';

const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;

if (!projectId) {
  console.error('FATAL: VITE_DESCOPE_PROJECT_ID is not set in .env. The application cannot start.');
  // You could render an error message to the user here
}

// Log environment variables for debugging (client-side only)
console.log('Environment Variables (Client-Side):', {
  VITE_DESCOPE_PROJECT_ID: import.meta.env.VITE_DESCOPE_PROJECT_ID ? 'Set' : 'Not Set',
  VITE_DESCOPE_FLOW_ID: import.meta.env.VITE_DESCOPE_FLOW_ID ? 'Set' : 'Not Set',
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
  VITE_SLACK_CLIENT_ID: import.meta.env.VITE_SLACK_CLIENT_ID ? 'Set' : 'Not Set',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider projectId={projectId}>
      <App />
    </AuthProvider>
  </StrictMode>
);
