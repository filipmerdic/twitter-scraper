const logger = require('./logger');

/**
 * Sanitize text for Slack message
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeForSlack(text) {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format tweet text for Slack
 * @param {Object} tweet - Tweet object
 * @returns {string} Formatted text
 */
function formatTweetText(tweet) {
  // Handle TwitterAPI.io structure
  let text = tweet.text || tweet.full_text || '';
  
  // Remove URLs that are already in entities
  if (tweet.entities && tweet.entities.urls) {
    tweet.entities.urls.forEach(url => {
      text = text.replace(url.url, url.expanded_url || url.url);
    });
  }
  
  return sanitizeForSlack(text);
}

/**
 * Check if tweet matches keyword filters
 * @param {Object} tweet - Tweet object
 * @param {Array} keywords - Keywords to filter by
 * @returns {boolean} Whether tweet matches keywords
 */
function matchesKeywords(tweet, keywords = []) {
  if (!keywords || keywords.length === 0) return true;
  
  const text = (tweet.text || tweet.full_text || '').toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Check if tweet should be included based on settings
 * @param {Object} tweet - Tweet object
 * @param {Object} profileConfig - Profile configuration
 * @returns {boolean} Whether tweet should be included
 */
function shouldIncludeTweet(tweet, profileConfig) {
  // Check if it's a retweet and if we should include retweets
  if (tweet.retweeted_tweet && !profileConfig.includeRetweets) {
    return false;
  }
  
  // Check if it's a reply and if we should include replies
  if (tweet.isReply && !profileConfig.includeReplies) {
    return false;
  }
  
  // Check keywords
  if (!matchesKeywords(tweet, profileConfig.keywords)) {
    return false;
  }
  
  return true;
}

/**
 * Create Slack message block for a tweet
 * @param {Object} tweet - Tweet object
 * @param {Object} profileConfig - Profile configuration
 * @returns {Object} Slack block
 */
function createTweetBlock(tweet, profileConfig) {
  const text = formatTweetText(tweet);
  const tweetUrl = tweet.twitterUrl || `https://twitter.com/${profileConfig.username}/status/${tweet.id}`;
  const timestamp = new Date(tweet.createdAt).toISOString();
  
  // Get profile picture from the new structure
  const profilePicture = tweet.author?.profilePicture || "";
  
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${profileConfig.displayName}* tweeted:\n\n${text}\n\n<${tweetUrl}|View on Twitter>`
    },
    accessory: {
      type: "image",
      image_url: profilePicture,
      alt_text: `${profileConfig.displayName}'s profile picture`
    }
  };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiting helper
 * @param {number} requestsPerMinute - Maximum requests per minute
 * @returns {Function} Rate limiting function
 */
function createRateLimiter(requestsPerMinute) {
  const interval = 60000 / requestsPerMinute; // Convert to milliseconds
  let lastRequest = 0;
  
  return async function() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < interval) {
      const waitTime = interval - timeSinceLastRequest;
      logger.info(`Rate limiting: waiting ${waitTime}ms`);
      await sleep(waitTime);
    }
    
    lastRequest = Date.now();
  };
}

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
function validateEnvironment() {
  const required = [
    'SLACK_WEBHOOK_URL',
    'SCRAPE_INTERVAL_MINUTES'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  // Check that at least one Twitter API is configured
  const hasTwitterAPI = process.env.TWITTERAPI_API_KEY || process.env.APIFY_API_TOKEN;
  
  if (!hasTwitterAPI) {
    return {
      valid: false,
      missing: ['TWITTERAPI_API_KEY or APIFY_API_TOKEN'],
      message: 'At least one Twitter API configuration is required'
    };
  }
  
  return { valid: true };
}

module.exports = {
  sanitizeForSlack,
  formatTweetText,
  matchesKeywords,
  shouldIncludeTweet,
  createTweetBlock,
  sleep,
  createRateLimiter,
  validateEnvironment
}; 