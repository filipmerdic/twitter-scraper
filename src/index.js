require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const profilesApi = require('../api/profiles');

class TwitterScraperServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
  }

  /**
   * Initialize the server
   */
  async init() {
    try {
      this.setupMiddleware();
      this.setupRoutes();
      
      if (!this.isServerless) {
        // Only initialize scraper in non-serverless environments
        const { validateEnvironment } = require('./utils/helpers');
        const TwitterScraper = require('./scraper');
        const dbService = require('./services/dbService');
        const cron = require('node-cron');
        
        // Validate environment
        validateEnvironment();
        
        // Initialize services
        await dbService.init();
        this.scraper = new TwitterScraper();
        
        // Setup cron job for scraping
        const intervalMinutes = process.env.SCRAPE_INTERVAL_MINUTES || 30;
        cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
          try {
            logger.info('Running scheduled scrape...');
            await this.scraper.run();
          } catch (error) {
            logger.error('Scheduled scrape failed:', error.message);
          }
        });
        
        logger.info(`Scheduled scraping every ${intervalMinutes} minutes`);
      } else {
        logger.info('Running in serverless mode - scraper initialization skipped');
      }
      
      this.isInitialized = true;
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error.message);
      // Don't throw in serverless mode - just log the error
      if (!this.isServerless) {
        throw error;
      }
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false // Disable CSP for development
    }));
    this.app.use(cors());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        serverless: this.isServerless
      });
    });

    // Manual trigger endpoint
    this.app.post('/scrape', async (req, res) => {
      try {
        if (this.isServerless) {
          return res.status(503).json({ 
            error: 'Scraping not available in serverless mode',
            message: 'This endpoint requires a full server environment'
          });
        }

        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        logger.info('Manual scrape triggered via API');
        await this.scraper.run();
        
        const stats = this.scraper.getStats();
        res.json({
          success: true,
          message: 'Scraping completed',
          stats
        });
      } catch (error) {
        logger.error('Manual scrape failed:', error.message);
        res.status(500).json({
          error: 'Scraping failed',
          message: error.message
        });
      }
    });

    // Get statistics endpoint
    this.app.get('/stats', (req, res) => {
      try {
        if (this.isServerless) {
          return res.json({
            totalTweets: 0,
            totalProfiles: 0,
            lastRun: null,
            serverless: true,
            message: 'Stats not available in serverless mode'
          });
        }

        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        const stats = this.scraper.getStats();
        res.json(stats);
      } catch (error) {
        logger.error('Failed to get stats:', error.message);
        res.status(500).json({
          error: 'Failed to get statistics',
          message: error.message
        });
      }
    });

    // Profiles API endpoints
    this.app.get('/api/profiles', profilesApi.getProfiles);
    this.app.put('/api/profiles', profilesApi.updateProfiles);

    // Serve the frontend
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error.message);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  /**
   * Start the server
   */
  async start() {
    await this.init();
    
    if (!this.isServerless) {
      this.app.listen(this.port, () => {
        logger.info(`Twitter Scraper Server running on port ${this.port}`);
        logger.info(`Frontend available at: http://localhost:${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
      });
    }
  }
}

// Start server if called directly
if (require.main === module) {
  const server = new TwitterScraperServer();
  server.start();
}

// Export for serverless environments
module.exports = TwitterScraperServer;

// Serverless handler for Vercel
const server = new TwitterScraperServer();
server.init().catch(error => {
  logger.error('Failed to initialize serverless server:', error.message);
});

module.exports.handler = server.app; 