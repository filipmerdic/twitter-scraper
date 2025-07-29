# Twitter to Slack Scraper

A Node.js application that monitors specific Twitter profiles and sends new tweets directly to a Slack channel.

## 🏗️ Architecture

This project supports multiple deployment options:

1. **Server Mode**: Long-running Node.js server with cron jobs
2. **Serverless Mode**: AWS Lambda functions for cost-effective scaling
3. **GitHub Actions**: Free scheduled workflows for public repositories

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Twitter API access (via TwitterAPI.io or Apify)
- Slack workspace with webhook or bot token

### Installation

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
```

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
   - Edit `config/profiles.json` with Twitter usernames to monitor

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
├── serverless/
│   └── handler.js            # AWS Lambda handler
├── data/                     # Database files
├── logs/                     # Application logs
└── tests/                    # Test files
```

## 🔧 Usage

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

## 🧪 Testing

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