require('dotenv').config();
const TwitterScraper = require('../src/scraper');
const logger = require('../src/utils/logger');

let scraper = null;

/**
 * Initialize scraper instance
 */
async function initScraper() {
  if (!scraper) {
    scraper = new TwitterScraper();
    await scraper.init();
  }
  return scraper;
}

/**
 * Scheduled scraper function
 */
exports.scrape = async (event, context) => {
  try {
    logger.info('Lambda scraper function triggered');
    
    const scraper = await initScraper();
    await scraper.run();
    
    const stats = scraper.getStats();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Scraping completed',
        stats
      })
    };
  } catch (error) {
    logger.error('Lambda scraper failed:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Scraping failed',
        message: error.message
      })
    };
  }
};

/**
 * Manual trigger function
 */
exports.manualTrigger = async (event, context) => {
  try {
    logger.info('Manual trigger function called');
    
    const scraper = await initScraper();
    await scraper.run();
    
    const stats = scraper.getStats();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Manual scraping completed',
        stats
      })
    };
  } catch (error) {
    logger.error('Manual trigger failed:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Manual scraping failed',
        message: error.message
      })
    };
  }
};

/**
 * Health check function
 */
exports.healthCheck = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      })
    };
  } catch (error) {
    logger.error('Health check failed:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message
      })
    };
  }
};

/**
 * Get statistics function
 */
exports.getStats = async (event, context) => {
  try {
    const scraper = await initScraper();
    const stats = scraper.getStats();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(stats)
    };
  } catch (error) {
    logger.error('Get stats failed:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to get statistics',
        message: error.message
      })
    };
  }
}; 