const axios = require('axios');
const logger = require('../utils/logger');
const { createRateLimiter, sleep } = require('../utils/helpers');

class TwitterService {
  constructor() {
    this.apiType = this.detectApiType();
    this.rateLimiter = this.createRateLimiter();
    this.baseUrl = this.getBaseUrl();
    this.apiKey = this.getApiKey();
  }

  /**
   * Detect which Twitter API is configured
   * @returns {string} API type ('twitterapi' or 'apify')
   */
  detectApiType() {
    if (process.env.TWITTERAPI_API_KEY) {
      return 'twitterapi';
    } else if (process.env.APIFY_API_TOKEN) {
      return 'apify';
    } else {
      throw new Error('No Twitter API configuration found');
    }
  }

  /**
   * Get base URL for the API
   * @returns {string} Base URL
   */
  getBaseUrl() {
    if (this.apiType === 'twitterapi') {
      return process.env.TWITTERAPI_BASE_URL || 'https://api.twitterapi.io';
    } else if (this.apiType === 'apify') {
      return process.env.APIFY_BASE_URL || 'https://api.apify.com/v2';
    }
  }

  /**
   * Get API key/token
   * @returns {string} API key
   */
  getApiKey() {
    if (this.apiType === 'twitterapi') {
      return process.env.TWITTERAPI_API_KEY;
    } else if (this.apiType === 'apify') {
      return process.env.APIFY_API_TOKEN;
    }
  }

  /**
   * Create rate limiter based on API type
   * @returns {Function} Rate limiting function
   */
  createRateLimiter() {
    if (this.apiType === 'twitterapi') {
      // TwitterAPI.io typically allows 100 requests per minute
      return createRateLimiter(100);
    } else if (this.apiType === 'apify') {
      // Apify rate limits vary by plan, default to 60 per minute
      return createRateLimiter(60);
    }
  }

  /**
   * Fetch tweets for a user
   * @param {string} username - Twitter username
   * @param {string} sinceId - Tweet ID to start from (optional)
   * @param {number} count - Number of tweets to fetch
   * @returns {Promise<Array>} Array of tweets
   */
  async fetchUserTweets(username, sinceId = null, count = 20) {
    try {
      await this.rateLimiter();
      
      if (this.apiType === 'twitterapi') {
        return await this.fetchWithTwitterAPI(username, sinceId, count);
      } else if (this.apiType === 'apify') {
        return await this.fetchWithApify(username, sinceId, count);
      }
    } catch (error) {
      logger.error(`Failed to fetch tweets for ${username}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch tweets using TwitterAPI.io Advanced Search
   * @param {string} username - Twitter username
   * @param {string} sinceId - Tweet ID to start from (optional)
   * @param {number} count - Number of tweets to fetch
   * @returns {Promise<Array>} Array of tweets
   */
  async fetchWithTwitterAPI(username, sinceId, count) {
    // Calculate time window for the query
    const untilTime = new Date();
    const sinceTime = sinceId ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
    
    // Format times as strings in the format Twitter's API expects
    const sinceStr = sinceTime.toISOString().replace(/[T:]/g, '_').replace(/\..+/, '_UTC');
    const untilStr = untilTime.toISOString().replace(/[T:]/g, '_').replace(/\..+/, '_UTC');
    
    // Construct the query using advanced search syntax
    let query = `from:${username} since:${sinceStr} until:${untilStr} include:nativeretweets`;
    
    // API endpoint for advanced search
    const url = `${this.baseUrl}/twitter/tweet/advanced_search`;
    
    // Request parameters
    const params = {
      query: query,
      queryType: "Latest"
    };
    
    // Headers with API key (using X-API-Key as per documentation)
    const headers = {
      "X-API-Key": this.apiKey
    };
    
    // Make the request and handle pagination
    const allTweets = [];
    let nextCursor = null;
    
    while (true) {
      // Add cursor to params if we have one
      if (nextCursor) {
        params.cursor = nextCursor;
      }
      
      try {
        const response = await axios.get(url, {
          headers: headers,
          params: params,
          timeout: 30000
        });
        
        // Parse the response
        if (response.status === 200) {
          const data = response.data;
          const tweets = data.tweets || [];
          
          if (tweets.length > 0) {
            allTweets.push(...tweets);
          }
          
          // Check if there are more pages
          if (data.has_next_page && data.next_cursor) {
            nextCursor = data.next_cursor;
            continue;
          } else {
            break;
          }
        } else {
          logger.error(`TwitterAPI.io error: ${response.status} - ${response.data}`);
          break;
        }
      } catch (error) {
        logger.error(`TwitterAPI.io request failed: ${error.message}`);
        break;
      }
    }
    
    // Filter tweets by sinceId if provided (fallback to time-based filtering)
    if (sinceId && allTweets.length > 0) {
      return allTweets.filter(tweet => tweet.id > sinceId);
    }
    
    return allTweets;
  }

  /**
   * Fetch tweets using Apify
   * @param {string} username - Twitter username
   * @param {string} sinceId - Tweet ID to start from
   * @param {number} count - Number of tweets to fetch
   * @returns {Promise<Array>} Array of tweets
   */
  async fetchWithApify(username, sinceId, count) {
    // First, create a run of the Twitter scraper
    const createRunResponse = await axios.post(`${this.baseUrl}/acts/apify~twitter-scraper/runs`, {
      username: [username],
      maxTweets: count,
      addUserInfo: true,
      maxRequestRetries: 3
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const runId = createRunResponse.data.data.id;
    logger.info(`Created Apify run ${runId} for ${username}`);

    // Wait for the run to complete
    const tweets = await this.waitForApifyRun(runId);
    
    // Filter tweets by sinceId if provided
    if (sinceId && tweets.length > 0) {
      return tweets.filter(tweet => tweet.id > sinceId);
    }

    return tweets;
  }

  /**
   * Wait for Apify run to complete and get results
   * @param {string} runId - Apify run ID
   * @returns {Promise<Array>} Array of tweets
   */
  async waitForApifyRun(runId) {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      await sleep(10000); // Wait 10 seconds

      try {
        const response = await axios.get(`${this.baseUrl}/acts/apify~twitter-scraper/runs/${runId}/dataset/items`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (response.data && response.data.length > 0) {
          logger.info(`Apify run ${runId} completed with ${response.data.length} tweets`);
          return response.data;
        }
      } catch (error) {
        logger.warn(`Apify run ${runId} not ready yet, attempt ${attempts + 1}/${maxAttempts}`);
      }

      attempts++;
    }

    throw new Error(`Apify run ${runId} did not complete within expected time`);
  }

  /**
   * Get user information
   * @param {string} username - Twitter username
   * @returns {Promise<Object>} User information
   */
  async getUserInfo(username) {
    try {
      await this.rateLimiter();

      if (this.apiType === 'twitterapi') {
        const response = await axios.get(`${this.baseUrl}/user/by/username/${username}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        return response.data.data;
      } else if (this.apiType === 'apify') {
        // For Apify, we'll get user info from the tweet data
        const tweets = await this.fetchUserTweets(username, null, 1);
        return tweets[0]?.user || null;
      }
    } catch (error) {
      logger.error(`Failed to fetch user info for ${username}:`, error.message);
      return null;
    }
  }

  /**
   * Validate API credentials
   * @returns {Promise<boolean>} Whether credentials are valid
   */
  async validateCredentials() {
    try {
      if (this.apiType === 'twitterapi') {
        // Test with a simple advanced search query
        const testQuery = 'from:twitter since:2025-07-29_00:00:00_UTC until:2025-07-29_23:59:59_UTC';
        const response = await axios.get(`${this.baseUrl}/twitter/tweet/advanced_search`, {
          headers: {
            'X-API-Key': this.apiKey
          },
          params: {
            query: testQuery,
            queryType: "Latest"
          },
          timeout: 10000
        });
        return response.status === 200;
      } else if (this.apiType === 'apify') {
        // Test with a simple API call
        const response = await axios.get(`${this.baseUrl}/users/me`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000
        });
        return response.status === 200;
      }
    } catch (error) {
      logger.error('API credentials validation failed:', error.message);
      return false;
    }
  }

  /**
   * Get API usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      if (this.apiType === 'twitterapi') {
        // TwitterAPI.io doesn't have a usage endpoint, return basic info
        return {
          provider: 'TwitterAPI.io',
          note: 'Usage statistics not available via API'
        };
      } else if (this.apiType === 'apify') {
        const response = await axios.get(`${this.baseUrl}/users/me`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        return {
          plan: response.data.plan,
          usage: response.data.usage
        };
      }
    } catch (error) {
      logger.error('Failed to get usage stats:', error.message);
      return null;
    }
  }
}

// Export the class instead of an instance
module.exports = TwitterService; 