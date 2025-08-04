const axios = require('axios');
const logger = require('../utils/logger');
const { createTweetBlock } = require('../utils/helpers');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.defaultChannel = process.env.SLACK_CHANNEL || '#general';
    
    if (!this.webhookUrl && !this.botToken) {
      throw new Error('Either SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN must be configured');
    }
  }

  /**
   * Send a simple text message to Slack
   * @param {string} message - Message to send
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendMessage(message, channel = null) {
    try {
      const payload = {
        text: message,
        channel: channel || this.defaultChannel
      };

      if (this.webhookUrl) {
        return await this.sendViaWebhook(payload);
      } else if (this.botToken) {
        return await this.sendViaBot(payload);
      }
    } catch (error) {
      logger.error('Failed to send Slack message:', error.message);
      return false;
    }
  }

  /**
   * Send a tweet to Slack with rich formatting
   * @param {Object} tweet - Tweet object
   * @param {Object} profileConfig - Profile configuration
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendTweet(tweet, profileConfig, channel = null) {
    try {
      const tweetBlock = createTweetBlock(tweet, profileConfig);
      
      const payload = {
        channel: channel || this.defaultChannel,
        blocks: [tweetBlock],
        unfurl_links: false,
        unfurl_media: false
      };

      if (this.webhookUrl) {
        return await this.sendViaWebhook(payload);
      } else if (this.botToken) {
        return await this.sendViaBot(payload);
      }
    } catch (error) {
      logger.error('Failed to send tweet to Slack:', error.message);
      console.error('Slack tweet error details:', error);
      return false;
    }
  }

  /**
   * Send multiple tweets in a single message
   * @param {Array} tweets - Array of tweet objects
   * @param {Object} profileConfig - Profile configuration
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendTweetBatch(tweets, profileConfig, channel = null) {
    try {
      if (tweets.length === 0) {
        return true;
      }

      const blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📱 New tweets from ${profileConfig.displayName}`,
            emoji: true
          }
        },
        {
          type: "divider"
        }
      ];

      // Add tweet blocks
      tweets.forEach(tweet => {
        blocks.push(createTweetBlock(tweet, profileConfig));
        blocks.push({ type: "divider" });
      });

      // Remove last divider
      blocks.pop();

      const payload = {
        channel: channel || this.defaultChannel,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      };

      if (this.webhookUrl) {
        return await this.sendViaWebhook(payload);
      } else if (this.botToken) {
        return await this.sendViaBot(payload);
      }
    } catch (error) {
      logger.error('Failed to send tweet batch to Slack:', error.message);
      return false;
    }
  }

  /**
   * Send message via webhook
   * @param {Object} payload - Message payload
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendViaWebhook(payload) {
    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        logger.info('Message sent to Slack via webhook');
        return true;
      } else {
        logger.error(`Webhook request failed with status ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error('Webhook request failed:', error.message);
      return false;
    }
  }

  /**
   * Send message via bot token
   * @param {Object} payload - Message payload
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendViaBot(payload) {
    try {
      const response = await axios.post('https://slack.com/api/chat.postMessage', payload, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.ok) {
        logger.info('Message sent to Slack via bot');
        return true;
      } else {
        logger.error(`Bot API request failed: ${response.data.error}`);
        return false;
      }
    } catch (error) {
      logger.error('Bot API request failed:', error.message);
      return false;
    }
  }

  /**
   * Send a status update message
   * @param {string} status - Status message
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendStatusUpdate(status, channel = null) {
    const message = `🤖 *Twitter Scraper Status*\n${status}`;
    return await this.sendMessage(message, channel);
  }

  /**
   * Send an error notification
   * @param {string} error - Error message
   * @param {string} context - Error context
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendErrorNotification(error, context = '', channel = null) {
    const message = `🚨 *Twitter Scraper Error*\n\n*Error:* ${error}\n${context ? `*Context:* ${context}` : ''}`;
    return await this.sendMessage(message, channel);
  }

  /**
   * Send a summary of processed tweets
   * @param {Object} summary - Summary object
   * @param {string} channel - Channel to send to (optional)
   * @returns {Promise<boolean>} Whether message was sent successfully
   */
  async sendSummary(summary, channel = null) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 Twitter Scraper Summary",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Profiles Checked:*\n${summary.profilesChecked}`
          },
          {
            type: "mrkdwn",
            text: `*New Tweets Found:*\n${summary.newTweetsFound}`
          },
          {
            type: "mrkdwn",
            text: `*Messages Sent:*\n${summary.messagesSent}`
          },
          {
            type: "mrkdwn",
            text: `*Duplicates Skipped:*\n${summary.duplicateTweetsSkipped || 0}`
          },
          {
            type: "mrkdwn",
            text: `*Errors:*\n${summary.errors}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Last run: ${new Date().toLocaleString()}`
          }
        ]
      }
    ];

    const payload = {
      channel: channel || this.defaultChannel,
      blocks: blocks
    };

    if (this.webhookUrl) {
      return await this.sendViaWebhook(payload);
    } else if (this.botToken) {
      return await this.sendViaBot(payload);
    }
  }

  /**
   * Test Slack connection
   * @returns {Promise<boolean>} Whether connection is working
   */
  async testConnection() {
    try {
      const testMessage = '🧪 Twitter Scraper connection test - ' + new Date().toISOString();
      return await this.sendMessage(testMessage);
    } catch (error) {
      logger.error('Slack connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get channel information (bot token only)
   * @param {string} channel - Channel name or ID
   * @returns {Promise<Object|null>} Channel information
   */
  async getChannelInfo(channel) {
    if (!this.botToken) {
      logger.warn('Bot token required for channel info');
      return null;
    }

    try {
      const response = await axios.get(`https://slack.com/api/conversations.info`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`
        },
        params: {
          channel: channel
        },
        timeout: 10000
      });

      if (response.data.ok) {
        return response.data.channel;
      } else {
        logger.error(`Failed to get channel info: ${response.data.error}`);
        return null;
      }
    } catch (error) {
      logger.error('Failed to get channel info:', error.message);
      return null;
    }
  }
}

// Export the class instead of an instance
module.exports = SlackService; 