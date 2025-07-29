const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the database
   */
  async init() {
    try {
      // Ensure data directory exists
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = process.env.DB_FILE_PATH || path.join(dataDir, 'tweets.json');
      const adapter = new FileSync(dbPath);
      this.db = low(adapter);

      // Set default data structure
      this.db.defaults({
        profiles: {},
        stats: {
          totalTweetsProcessed: 0,
          totalSlackMessagesSent: 0,
          lastRun: null,
          errors: []
        },
        settings: {
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      }).write();

      this.initialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Get last processed tweet ID for a profile
   * @param {string} username - Twitter username
   * @returns {string|null} Last tweet ID or null
   */
  getLastTweetId(username) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const profile = this.db.get('profiles').get(username).value();
    return profile?.lastTweetId || null;
  }

  /**
   * Set last processed tweet ID for a profile
   * @param {string} username - Twitter username
   * @param {string} tweetId - Tweet ID
   */
  setLastTweetId(username, tweetId) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    this.db.get('profiles')
      .set(username, {
        lastTweetId: tweetId,
        lastUpdated: new Date().toISOString(),
        tweetCount: (this.db.get('profiles').get(username).get('tweetCount').value() || 0) + 1
      })
      .write();

    logger.info(`Updated last tweet ID for ${username}: ${tweetId}`);
  }

  /**
   * Record a processed tweet
   * @param {string} username - Twitter username
   * @param {Object} tweet - Tweet object
   * @param {boolean} sentToSlack - Whether tweet was sent to Slack
   */
  recordTweet(username, tweet, sentToSlack = false) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const tweetRecord = {
      id: tweet.id_str,
      text: tweet.text || tweet.full_text,
      created_at: tweet.created_at,
      processed_at: new Date().toISOString(),
      sent_to_slack: sentToSlack
    };

    // Add to profile's tweet history (keep last 100)
    const profile = this.db.get('profiles').get(username);
    const history = profile.get('history').value() || [];
    history.unshift(tweetRecord);
    
    if (history.length > 100) {
      history.splice(100);
    }

    profile.set('history', history).write();

    // Update stats
    this.db.get('stats')
      .update('totalTweetsProcessed', n => n + 1)
      .update('totalSlackMessagesSent', n => sentToSlack ? n + 1 : n)
      .set('lastRun', new Date().toISOString())
      .write();
  }

  /**
   * Record an error
   * @param {string} error - Error message
   * @param {string} context - Error context
   */
  recordError(error, context = '') {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const errorRecord = {
      message: error,
      context,
      timestamp: new Date().toISOString()
    };

    this.db.get('stats.errors')
      .push(errorRecord)
      .write();

    // Keep only last 50 errors
    const errors = this.db.get('stats.errors').value();
    if (errors.length > 50) {
      this.db.set('stats.errors', errors.slice(-50)).write();
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.db.get('stats').value();
  }

  /**
   * Get profile statistics
   * @param {string} username - Twitter username
   * @returns {Object} Profile statistics
   */
  getProfileStats(username) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const profile = this.db.get('profiles').get(username).value();
    return profile || {
      lastTweetId: null,
      lastUpdated: null,
      tweetCount: 0,
      history: []
    };
  }

  /**
   * Get all profiles data
   * @returns {Object} All profiles data
   */
  getAllProfiles() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.db.get('profiles').value();
  }

  /**
   * Clear old data (older than 30 days)
   */
  cleanup() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const profiles = this.db.get('profiles').value();
    
    Object.keys(profiles).forEach(username => {
      const profile = profiles[username];
      if (profile.history) {
        const filteredHistory = profile.history.filter(tweet => 
          new Date(tweet.processed_at) > thirtyDaysAgo
        );
        
        this.db.get('profiles')
          .get(username)
          .set('history', filteredHistory)
          .write();
      }
    });

    logger.info('Database cleanup completed');
  }

  /**
   * Backup database
   * @returns {string} Backup file path
   */
  backup() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../data/backup-${timestamp}.json`);
    
    const data = this.db.getState();
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    
    logger.info(`Database backed up to: ${backupPath}`);
    return backupPath;
  }
}

module.exports = new DatabaseService(); 