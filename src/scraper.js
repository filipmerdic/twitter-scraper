require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { validateEnvironment, shouldIncludeTweet } = require('./utils/helpers');
const TwitterService = require('./services/twitterService');
const SlackService = require('./services/slackService');
const dbService = require('./services/dbService');

class TwitterScraper {
  constructor() {
    this.profiles = [];
    this.stats = {
      profilesChecked: 0,
      newTweetsFound: 0,
      messagesSent: 0,
      errors: 0
    };
    this.twitterService = null;
    this.slackService = null;
  }

  /**
   * Initialize the scraper
   */
  async init() {
    try {
      // Validate environment
      const envValidation = validateEnvironment();
      if (!envValidation.valid) {
        throw new Error(envValidation.message);
      }

      // Load profiles configuration
      await this.loadProfiles();

      // Initialize database
      await dbService.init();

      // Test connections
      await this.testConnections();

      logger.info('Twitter Scraper initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scraper:', error.message);
      console.error('Initialization error details:', error);
      throw error;
    }
  }

  /**
   * Load profiles from configuration file
   */
  async loadProfiles() {
    try {
      const configPath = path.join(__dirname, 'config', 'profiles.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      this.profiles = config.profiles.filter(profile => profile.enabled);
      this.settings = config.settings;
      
      logger.info(`Loaded ${this.profiles.length} enabled profiles`);
      console.log('Loaded profiles:', this.profiles.map(p => `${p.username} (${p.displayName})`));
    } catch (error) {
      logger.error('Failed to load profiles:', error.message);
      throw error;
    }
  }

  /**
   * Test API connections
   */
  async testConnections() {
    try {
      // Initialize Twitter service
      this.twitterService = new TwitterService();
      
      // Test Twitter API
      const twitterValid = await this.twitterService.validateCredentials();
      if (!twitterValid) {
        throw new Error('Twitter API credentials are invalid');
      }
      logger.info('Twitter API connection validated');

      // Initialize Slack service
      this.slackService = new SlackService();
      
      // Test Slack connection
      const slackValid = await this.slackService.testConnection();
      if (!slackValid) {
        throw new Error('Slack connection failed');
      }
      logger.info('Slack connection validated');
    } catch (error) {
      logger.error('Connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Run the scraping process
   */
  async run() {
    logger.info('Starting Twitter scraping process');
    
    this.stats = {
      profilesChecked: 0,
      newTweetsFound: 0,
      messagesSent: 0,
      errors: 0
    };

    for (const profile of this.profiles) {
      try {
        await this.processProfile(profile);
        this.stats.profilesChecked++;
      } catch (error) {
        this.stats.errors++;
        logger.error(`Failed to process profile ${profile.username}:`, error.message);
        
        // Send error notification to Slack
        await this.slackService.sendErrorNotification(
          error.message,
          `Profile: ${profile.username}`,
          process.env.SLACK_CHANNEL
        );
      }
    }

    // Send summary
    await this.sendSummary();
    
    logger.info('Twitter scraping process completed', this.stats);
  }

  /**
   * Process a single profile
   * @param {Object} profile - Profile configuration
   */
  async processProfile(profile) {
    logger.info(`Processing profile: ${profile.username}`);
    console.log(`Processing profile: ${profile.username} (${profile.displayName})`);
    
    // Get last processed tweet ID
    const lastTweetId = dbService.getLastTweetId(profile.username);
    
    // Fetch new tweets
    const tweets = await this.twitterService.fetchUserTweets(
      profile.username,
      lastTweetId,
      this.settings.maxTweetsPerProfile
    );

    if (tweets.length === 0) {
      logger.info(`No new tweets found for ${profile.username}`);
      return;
    }

    // Filter tweets based on profile settings
    const filteredTweets = tweets.filter(tweet => 
      shouldIncludeTweet(tweet, profile)
    );

    if (filteredTweets.length === 0) {
      logger.info(`No tweets matching criteria for ${profile.username}`);
      return;
    }

    logger.info(`Found ${filteredTweets.length} new tweets for ${profile.username}`);

    // Send tweets to Slack
    let sentCount = 0;
    for (const tweet of filteredTweets) {
      try {
        const sent = await this.slackService.sendTweet(tweet, profile);
        if (sent) {
          sentCount++;
          this.stats.messagesSent++;
        }
        
        // Record tweet in database
        dbService.recordTweet(profile.username, tweet, sent);
        
        // Update last tweet ID
        dbService.setLastTweetId(profile.username, tweet.id_str);
        
        this.stats.newTweetsFound++;
      } catch (error) {
        logger.error(`Failed to send tweet ${tweet.id_str}:`, error.message);
        console.error(`Slack error details for tweet ${tweet.id_str}:`, error);
        dbService.recordTweet(profile.username, tweet, false);
      }
    }

    logger.info(`Sent ${sentCount}/${filteredTweets.length} tweets for ${profile.username}`);
  }

  /**
   * Send summary to Slack
   */
  async sendSummary() {
    try {
      await this.slackService.sendSummary(this.stats);
      logger.info('Summary sent to Slack');
    } catch (error) {
      logger.error('Failed to send summary:', error.message);
    }
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      database: dbService.getStats()
    };
  }

  /**
   * Get profile statistics
   * @param {string} username - Twitter username
   * @returns {Object} Profile statistics
   */
  getProfileStats(username) {
    return dbService.getProfileStats(username);
  }

  /**
   * Clean up old data
   */
  async cleanup() {
    try {
      dbService.cleanup();
      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Cleanup failed:', error.message);
    }
  }

  /**
   * Create backup
   * @returns {string} Backup file path
   */
  async backup() {
    try {
      const backupPath = dbService.backup();
      logger.info(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      logger.error('Backup failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const scraper = new TwitterScraper();
  
  try {
    await scraper.init();
    await scraper.run();
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    logger.error('Scraper failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = TwitterScraper;

// Run if called directly
if (require.main === module) {
  main();
} 