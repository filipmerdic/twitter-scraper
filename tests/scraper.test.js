const TwitterScraper = require('../src/scraper');
const { validateEnvironment } = require('../src/utils/helpers');
const dbService = require('../src/services/dbService');

// Mock environment variables for testing
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
process.env.SCRAPE_INTERVAL_MINUTES = '15';
process.env.TWITTERAPI_API_KEY = 'test_key';

describe('Twitter Scraper', () => {
  let scraper;

  beforeEach(async () => {
    scraper = new TwitterScraper();
    await dbService.init();
  });

  afterEach(async () => {
    // Clean up test data
    await scraper.cleanup();
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

  test('should detect and skip duplicate tweet content', async () => {
    const mockTweet = {
      id_str: '123456789',
      text: 'This is a test tweet about AI and machine learning',
      created_at: '2023-01-01T12:00:00.000Z'
    };

    const mockProfile = {
      username: 'testuser',
      displayName: 'Test User',
      enabled: true
    };

    // First time - should not be duplicate
    const isDuplicate1 = dbService.isDuplicateContent(mockTweet);
    expect(isDuplicate1).toBe(false);

    // Mark as processed
    dbService.markContentAsProcessed(mockTweet, mockProfile.username);

    // Second time - should be duplicate
    const isDuplicate2 = dbService.isDuplicateContent(mockTweet);
    expect(isDuplicate2).toBe(true);

    // Different tweet with same content - should be duplicate
    const duplicateTweet = {
      id_str: '987654321',
      text: 'This is a test tweet about AI and machine learning',
      created_at: '2023-01-01T13:00:00.000Z'
    };

    const isDuplicate3 = dbService.isDuplicateContent(duplicateTweet);
    expect(isDuplicate3).toBe(true);
  });

  test('should generate consistent content hashes', () => {
    const tweet1 = {
      id_str: '123',
      text: 'Hello world!',
      created_at: '2023-01-01T12:00:00.000Z'
    };

    const tweet2 = {
      id_str: '456',
      text: 'Hello world!',
      created_at: '2023-01-01T13:00:00.000Z'
    };

    const tweet3 = {
      id_str: '789',
      text: 'Hello   world!', // Extra spaces
      created_at: '2023-01-01T14:00:00.000Z'
    };

    const hash1 = dbService.generateContentHash(tweet1);
    const hash2 = dbService.generateContentHash(tweet2);
    const hash3 = dbService.generateContentHash(tweet3);

    // Same content should have same hash
    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
  });
}); 