require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const logger = require('./utils/logger');
const { validateEnvironment } = require('./utils/helpers');
const TwitterScraper = require('./scraper');
const dbService = require('./services/dbService');

class TwitterScraperServer {
  constructor() {
    this.app = express();
    this.scraper = new TwitterScraper();
    this.port = process.env.PORT || 3000;
    this.isInitialized = false;
  }

  /**
   * Initialize the server
   */
  async init() {
    try {
      // Validate environment
      const envValidation = validateEnvironment();
      if (!envValidation.valid) {
        throw new Error(envValidation.message);
      }

      // Initialize scraper
      await this.scraper.init();

      // Setup Express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup cron job
      this.setupCronJob();

      this.isInitialized = true;
      logger.info('Twitter Scraper Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error.message);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

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
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Manual trigger endpoint
    this.app.post('/scrape', async (req, res) => {
      try {
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

    // Get profile statistics endpoint
    this.app.get('/stats/profile/:username', (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        const { username } = req.params;
        const stats = this.scraper.getProfileStats(username);
        res.json(stats);
      } catch (error) {
        logger.error('Failed to get profile stats:', error.message);
        res.status(500).json({
          error: 'Failed to get profile statistics',
          message: error.message
        });
      }
    });

    // Test connections endpoint
    this.app.post('/test', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        await this.scraper.testConnections();
        res.json({
          success: true,
          message: 'All connections tested successfully'
        });
      } catch (error) {
        logger.error('Connection test failed:', error.message);
        res.status(500).json({
          error: 'Connection test failed',
          message: error.message
        });
      }
    });

    // Cleanup endpoint
    this.app.post('/cleanup', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        await this.scraper.cleanup();
        res.json({
          success: true,
          message: 'Cleanup completed successfully'
        });
      } catch (error) {
        logger.error('Cleanup failed:', error.message);
        res.status(500).json({
          error: 'Cleanup failed',
          message: error.message
        });
      }
    });

    // Backup endpoint
    this.app.post('/backup', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Server not initialized' });
        }

        const backupPath = await this.scraper.backup();
        res.json({
          success: true,
          message: 'Backup created successfully',
          backupPath
        });
      } catch (error) {
        logger.error('Backup failed:', error.message);
        res.status(500).json({
          error: 'Backup failed',
          message: error.message
        });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });
  }

  /**
   * Setup cron job for scheduled scraping
   */
  setupCronJob() {
    const intervalMinutes = parseInt(process.env.SCRAPE_INTERVAL_MINUTES) || 15;
    
    // Convert minutes to cron expression (every X minutes)
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    cron.schedule(cronExpression, async () => {
      try {
        logger.info('Scheduled scraping triggered');
        await this.scraper.run();
      } catch (error) {
        logger.error('Scheduled scraping failed:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    logger.info(`Cron job scheduled to run every ${intervalMinutes} minutes`);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.init();
      
      this.app.listen(this.port, () => {
        logger.info(`Twitter Scraper Server running on port ${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`Manual trigger: POST http://localhost:${this.port}/scrape`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error.message);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down server...');
    
    // Close any open connections
    if (this.server) {
      this.server.close();
    }
    
    // Perform cleanup
    try {
      await this.scraper.cleanup();
    } catch (error) {
      logger.error('Cleanup during shutdown failed:', error.message);
    }
    
    logger.info('Server shutdown complete');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.shutdown();
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  if (server) {
    server.shutdown();
  }
});

// Start server if called directly
if (require.main === module) {
  const server = new TwitterScraperServer();
  server.start();
}

module.exports = TwitterScraperServer; 