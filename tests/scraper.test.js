const TwitterScraper = require('../src/scraper');
const { validateEnvironment } = require('../src/utils/helpers');

// Mock environment variables for testing
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
process.env.SCRAPE_INTERVAL_MINUTES = '15';
process.env.TWITTERAPI_API_KEY = 'test_key';

describe('Twitter Scraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new TwitterScraper();
  });

  describe('Environment Validation', () => {
    test('should validate environment variables', () => {
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });

    test('should fail with missing required variables', () => {
      const originalWebhook = process.env.SLACK_WEBHOOK_URL;
      delete process.env.SLACK_WEBHOOK_URL;
      
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SLACK_WEBHOOK_URL');
      
      // Restore
      process.env.SLACK_WEBHOOK_URL = originalWebhook;
    });
  });

  describe('Scraper Initialization', () => {
    test('should create scraper instance', () => {
      expect(scraper).toBeDefined();
      expect(scraper.profiles).toEqual([]);
      expect(scraper.stats).toBeDefined();
    });

    test('should have correct initial stats', () => {
      expect(scraper.stats.profilesChecked).toBe(0);
      expect(scraper.stats.newTweetsFound).toBe(0);
      expect(scraper.stats.messagesSent).toBe(0);
      expect(scraper.stats.errors).toBe(0);
    });
  });

  describe('Profile Loading', () => {
    test('should load profiles from config', async () => {
      // Mock fs.readFileSync
      const fs = require('fs');
      const originalReadFile = fs.readFileSync;
      
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
        profiles: [
          {
            username: 'testuser',
            displayName: 'Test User',
            enabled: true,
            includeRetweets: false,
            includeReplies: false,
            keywords: []
          }
        ],
        settings: {
          maxTweetsPerProfile: 10,
          minIntervalMinutes: 5
        }
      }));

      await scraper.loadProfiles();
      
      expect(scraper.profiles).toHaveLength(1);
      expect(scraper.profiles[0].username).toBe('testuser');
      
      // Restore
      fs.readFileSync = originalReadFile;
    });
  });
}); 