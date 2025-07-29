const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const logger = require('../src/utils/logger');
const profilesApi = require('../api/profiles');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'serverless',
    serverless: true
  });
});

// Manual trigger endpoint (not available in serverless)
app.post('/scrape', (req, res) => {
  res.status(503).json({ 
    error: 'Scraping not available in serverless mode',
    message: 'This endpoint requires a full server environment'
  });
});

// Get statistics endpoint (serverless mode)
app.get('/stats', (req, res) => {
  res.json({
    totalTweets: 0,
    totalProfiles: 0,
    lastRun: null,
    serverless: true,
    message: 'Stats not available in serverless mode'
  });
});

// Profiles API endpoints
app.get('/api/profiles', profilesApi.getProfiles);
app.put('/api/profiles', profilesApi.updateProfiles);

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Export for Vercel
module.exports = app; 