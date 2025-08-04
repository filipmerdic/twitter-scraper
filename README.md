# Twitter to Slack Scraper

A Node.js application that monitors specific Twitter profiles and sends new tweets directly to a Slack channel. Now with a **web-based frontend** for easy account management!

## 🚀 Features

- **🔍 Smart Filtering**: Filter tweets by keywords, exclude retweets/replies
- **📱 Slack Integration**: Rich formatted messages with profile pictures
- **🔄 Real-time Updates**: Changes are saved immediately and picked up by the scraper
- **📊 Visual Dashboard**: See all monitored accounts at a glance
- **🛡️ Duplicate Prevention**: Content-based deduplication prevents the same tweet from appearing multiple times
- **📈 Comprehensive Stats**: Track processed tweets, duplicates skipped, and performance metrics

## Deduplication System

The app includes a robust deduplication system that prevents the same tweet content from appearing in multiple updates:

- **Content Hashing**: Each tweet's content is hashed to create a unique fingerprint
- **Global Tracking**: Processed tweet content is tracked across all profiles
- **Automatic Cleanup**: Old processed tweets are automatically cleaned up to prevent database bloat
- **Statistics**: Track how many duplicate tweets were skipped in each run

This ensures that even if the same tweet is fetched multiple times due to API inconsistencies, it will only be sent to Slack once.

## Scheduling Configuration

The Twitter scraper is configured to run **3 times per day** at the following times (EST):
- **8:00 AM EST** (1:00 PM UTC)
- **12:00 PM EST** (5:00 PM UTC) 
- **4:00 PM EST** (9:00 PM UTC)

This scheduling applies to all deployment methods:
- GitHub Actions (automated workflow)
- AWS Lambda (serverless functions)
- Docker containers (with cron scheduling)

The schedule can be customized by modifying the `SCRAPE_SCHEDULE` environment variable or the cron expressions in the respective configuration files.

## 🏗️ Architecture

This project supports multiple deployment options:

1. **Server Mode**: Long-running Node.js server with cron jobs
2. **Serverless Mode**: AWS Lambda functions for cost-effective scaling
3. **GitHub Actions**: Free scheduled workflows for public repositories

## 🚀 Quick Start

### Option 1: Deploy with Frontend (Recommended)

1. **Fork this repository** to your GitHub account
2. **Deploy to Railway/Render/Heroku** (see [DEPLOYMENT.md](DEPLOYMENT.md))
3. **Set environment variables** (Twitter API key, Slack webhook)
4. **Access the web interface** and add Twitter accounts
5. **Start monitoring!**

### Option 2: Local Development

```bash
# Clone the repository
git clone <your-repo>
cd twitter-scraper

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your API keys
nano .env

# Start the application
npm run dev

# Access the frontend at http://localhost:3000
```

### Prerequisites

- Node.js 18+ 
- Twitter API access (via TwitterAPI.io or Apify)
- Slack workspace with webhook or bot token

### Configuration

1. **Twitter API Setup**:
   - Sign up for [TwitterAPI.io](https://twitterapi.io) or [Apify](https://apify.com)
   - Get your API key/token
   - Add to `.env` file

2. **Slack Setup**:
   - Create a Slack app in your workspace
   - Add bot token or webhook URL
   - Invite bot to your target channel

3. **Target Profiles**:
   - Use the web interface at `http://localhost:3000` to manage profiles
   - Or edit `src/config/profiles.json` manually with Twitter usernames to monitor

## 📁 Project Structure

```
├── src/
│   ├── index.js              # Main server entry point
│   ├── scraper.js            # Core scraping logic
│   ├── services/
│   │   ├── twitterService.js # Twitter API integration
│   │   ├── slackService.js   # Slack message sending
│   │   └── dbService.js      # Database operations
│   ├── utils/
│   │   ├── logger.js         # Logging configuration
│   │   └── helpers.js        # Utility functions
│   └── config/
│       └── profiles.json     # Target Twitter profiles
├── public/                   # Frontend files
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles
│   └── script.js            # JavaScript functionality
├── api/                     # API endpoints
│   └── profiles.js          # Profile management API
├── serverless/
│   └── handler.js            # AWS Lambda handler
├── data/                     # Database files
├── logs/                     # Application logs
└── tests/                    # Test files
```

## 🔧 Usage

### Web Interface

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to `http://localhost:3000`

3. **Add Twitter accounts**:
   - Enter username and display name
   - Add keywords to filter tweets
   - Configure retweet/reply settings
   - Click "Add Account"

4. **Save changes**:
   - Click "Save All Changes" to persist your configuration
   - The scraper will use the updated profiles on its next run

### Server Mode (Recommended for development)

```bash
# Start the server
npm start

# Development mode with auto-restart
npm run dev
```

### Serverless Mode

```bash
# Deploy to AWS Lambda
npm run deploy

# Test locally
serverless offline
```

### Manual Scraping

```bash
# Run one-time scraping
npm run scrape
```

## 📊 Monitoring

The application tracks:
- Last processed tweet ID per profile
- Scraping success/failure rates
- Slack delivery status
- API rate limit usage

## 🔒 Security

- All API keys stored in environment variables
- Rate limiting to respect API limits
- Input validation and sanitization
- Secure logging (no sensitive data)

## �� Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📈 Scaling Considerations

### For High Volume:
- Use Redis instead of file-based storage
- Implement queue system (Redis/Bull)
- Add multiple worker processes
- Use database instead of JSON files

### For Multiple Workspaces:
- Multi-tenant architecture
- Separate config per workspace
- Database per tenant

## 🚨 Troubleshooting

### Common Issues:

1. **Rate Limiting**: Check API limits and adjust intervals
2. **Slack Permissions**: Ensure bot has channel access
3. **Network Issues**: Check firewall/proxy settings
4. **Storage**: Ensure write permissions to data directory

### Logs:
- Check `logs/app.log` for detailed error information
- Set `LOG_LEVEL=debug` for verbose logging

## 📝 License

MIT License - see LICENSE file for details 