#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 Twitter to Slack Scraper Setup\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    const overwrite = await question('Environment file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Configuration Options:\n');
  
  // Twitter API Configuration
  console.log('1. Twitter API Configuration:');
  const twitterApiChoice = await question('Choose Twitter API provider (1: TwitterAPI.io, 2: Apify): ');
  
  let twitterApiKey = '';
  let apifyToken = '';
  
  if (twitterApiChoice === '1') {
    twitterApiKey = await question('Enter your TwitterAPI.io API key: ');
  } else if (twitterApiChoice === '2') {
    apifyToken = await question('Enter your Apify API token: ');
  } else {
    console.log('Invalid choice. Using TwitterAPI.io.');
    twitterApiKey = await question('Enter your TwitterAPI.io API key: ');
  }

  // Slack Configuration
  console.log('\n2. Slack Configuration:');
  const slackChoice = await question('Choose Slack integration (1: Webhook, 2: Bot Token): ');
  
  let webhookUrl = '';
  let botToken = '';
  
  if (slackChoice === '1') {
    webhookUrl = await question('Enter your Slack webhook URL: ');
  } else if (slackChoice === '2') {
    botToken = await question('Enter your Slack bot token: ');
  } else {
    console.log('Invalid choice. Using webhook.');
    webhookUrl = await question('Enter your Slack webhook URL: ');
  }
  
  const channel = await question('Enter Slack channel name (e.g., #general): ');
  
  // Application Configuration
  console.log('\n3. Application Configuration:');
  const interval = await question('Scraping interval in minutes (default: 15): ') || '15';
  const maxTweets = await question('Max tweets per run (default: 50): ') || '50';
  const logLevel = await question('Log level (debug, info, warn, error) [default: info]: ') || 'info';

  // Generate .env content
  const envContent = `# Twitter API Configuration
${twitterApiKey ? `TWITTERAPI_API_KEY=${twitterApiKey}` : '# TWITTERAPI_API_KEY=your_twitterapi_key_here'}
${apifyToken ? `APIFY_API_TOKEN=${apifyToken}` : '# APIFY_API_TOKEN=your_apify_token_here'}

# Slack Configuration
${webhookUrl ? `SLACK_WEBHOOK_URL=${webhookUrl}` : '# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'}
${botToken ? `SLACK_BOT_TOKEN=${botToken}` : '# SLACK_BOT_TOKEN=xoxb-your-bot-token-here'}
SLACK_CHANNEL=${channel}

# Application Configuration
NODE_ENV=development
PORT=3000
SCRAPE_INTERVAL_MINUTES=${interval}
MAX_TWEETS_PER_RUN=${maxTweets}

# Database Configuration
DB_FILE_PATH=./data/tweets.json

# Logging
LOG_LEVEL=${logLevel}
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment file created successfully!');
  
  // Create data and logs directories
  const dataDir = path.join(__dirname, '..', 'data');
  const logsDir = path.join(__dirname, '..', 'logs');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Edit src/config/profiles.json to add Twitter profiles to monitor');
  console.log('2. Run "npm install" to install dependencies');
  console.log('3. Run "npm start" to start the server');
  console.log('4. Or run "npm run scrape" for a one-time scraping');
  
  console.log('\n📚 Documentation:');
  console.log('- README.md for detailed setup instructions');
  console.log('- Check logs/app.log for application logs');
  
  rl.close();
}

setup().catch(console.error); 