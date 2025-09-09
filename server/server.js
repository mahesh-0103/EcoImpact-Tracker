import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import expressListEndpoints from 'express-list-endpoints';

// Import route modules
import carbonRoutes from './routes/carbon.js';
import googleCalendarRoutes from './routes/google-calendar.js';
import slackRoutes from './routes/slack.js';
import authRoutes from './routes/auth.js'; // Import the new auth routes
import descopeAuth from './middleware/descope-auth.js';
import debugRoutes from './routes/debug.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === 'production';

// --- Final CORS Configuration ---
// This is a more permissive setting to ensure functionality in complex proxy environments.
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
}));

// Security Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, 
}));

// Standard Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- ROUTE CONFIGURATION ---
app.use('/api/auth', authRoutes); // Register the new auth routes
app.use('/api/carbon', carbonRoutes);
app.use('/api/calendar', descopeAuth, googleCalendarRoutes);
app.use('/api/slack', descopeAuth, slackRoutes);

if (!isProduction) {
    app.use('/api/debug', debugRoutes);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : err.message,
    stack: isProduction ? undefined : err.stack,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});


function getEndpointList(mainApp) {
  const tempRouter = express.Router();
  
  tempRouter.use('/api/auth', authRoutes);
  tempRouter.use('/api/carbon', carbonRoutes);
  tempRouter.use('/api/calendar', googleCalendarRoutes); 
  tempRouter.use('/api/slack', slackRoutes);
  if (process.env.NODE_ENV !== 'production') {
    tempRouter.use('/api/debug', debugRoutes);
  }
  tempRouter.get('/health', (req, res) => res.json({ status: 'temp-healthy' }));

  return expressListEndpoints(tempRouter);
}

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  if (!isProduction) {
    console.log('\n-- Registered API Endpoints --');
    try {
        const endpoints = getEndpointList(app);
        if (endpoints.length > 0) {
          console.table(endpoints.map(e => ({ path: e.path, methods: e.methods.join(', ') })));
        } else {
          console.log('No routes were registered.');
        }
    } catch (e) {
        console.error('Could not list endpoints:', e.message)
    }
    console.log('-------------------------------------\n');
  }
});

export default app;
