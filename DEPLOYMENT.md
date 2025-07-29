# Deployment Guide

This guide covers multiple deployment options for the Twitter to Slack Scraper.

## 🚀 Quick Start (Local Development)

1. **Setup Environment**:
   ```bash
   npm run setup
   # Follow the interactive prompts
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Profiles**:
   Edit `src/config/profiles.json` with Twitter usernames to monitor.

4. **Run Locally**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   
   # One-time scraping
   npm run scrape
   ```

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and run with Docker Compose
npm run docker:compose

# View logs
docker-compose logs -f twitter-scraper

# Stop services
docker-compose down
```

### Option 2: Manual Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Docker Environment Variables

Create a `.env` file for Docker:

```env
# Twitter API
TWITTERAPI_API_KEY=your_key_here
# or
APIFY_API_TOKEN=your_token_here

# Slack
SLACK_WEBHOOK_URL=your_webhook_url
SLACK_CHANNEL=#your-channel

# App Settings
SCRAPE_INTERVAL_MINUTES=15
MAX_TWEETS_PER_RUN=50
NODE_ENV=production
```

## ☁️ Cloud Deployment

### Option 1: AWS Lambda (Serverless)

**Prerequisites**:
- AWS CLI configured
- Serverless Framework installed: `npm install -g serverless`

**Deploy**:
```bash
# Install dependencies
npm install

# Deploy to AWS
npm run deploy

# Test locally
serverless offline
```

**Environment Variables**:
Set in AWS Systems Manager Parameter Store or use serverless.yml environment section.

### Option 2: Heroku

**Prerequisites**:
- Heroku CLI installed
- Heroku account

**Deploy**:
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set TWITTERAPI_API_KEY=your_key
heroku config:set SLACK_WEBHOOK_URL=your_webhook
heroku config:set SLACK_CHANNEL=#your-channel
heroku config:set SCRAPE_INTERVAL_MINUTES=15

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 3: Railway

**Prerequisites**:
- Railway account
- Railway CLI installed

**Deploy**:
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set TWITTERAPI_API_KEY=your_key
railway variables set SLACK_WEBHOOK_URL=your_webhook
railway variables set SLACK_CHANNEL=#your-channel

# Deploy
railway up
```

### Option 4: DigitalOcean App Platform

1. Connect your GitHub repository
2. Choose Node.js environment
3. Set environment variables in the dashboard
4. Deploy

## 🔄 GitHub Actions (Free Tier)

**Perfect for**: Small-scale monitoring, free hosting

**Setup**:
1. Fork this repository
2. Add secrets in GitHub repository settings:
   - `TWITTERAPI_API_KEY`
   - `SLACK_WEBHOOK_URL`
   - `SLACK_CHANNEL`
   - `APIFY_API_TOKEN` (if using Apify)

3. The workflow will run automatically every 15 minutes

**Manual Trigger**:
- Go to Actions tab
- Select "Twitter Scraper" workflow
- Click "Run workflow"

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Get statistics
curl http://localhost:3000/stats

# Manual trigger
curl -X POST http://localhost:3000/scrape
```

### Logs

```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# Docker logs
docker-compose logs -f twitter-scraper
```

### Database Management

```bash
# Create backup
curl -X POST http://localhost:3000/backup

# Cleanup old data
curl -X POST http://localhost:3000/cleanup
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `TWITTERAPI_API_KEY` | Yes* | TwitterAPI.io API key | - |
| `APIFY_API_TOKEN` | Yes* | Apify API token | - |
| `SLACK_WEBHOOK_URL` | Yes* | Slack webhook URL | - |
| `SLACK_BOT_TOKEN` | Yes* | Slack bot token | - |
| `SLACK_CHANNEL` | Yes | Target Slack channel | #general |
| `SCRAPE_INTERVAL_MINUTES` | No | Scraping interval | 15 |
| `MAX_TWEETS_PER_RUN` | No | Max tweets per profile | 50 |
| `NODE_ENV` | No | Environment | development |
| `PORT` | No | Server port | 3000 |
| `LOG_LEVEL` | No | Logging level | info |

*Either TwitterAPI.io or Apify credentials are required

### Profile Configuration

Edit `src/config/profiles.json`:

```json
{
  "profiles": [
    {
      "username": "elonmusk",
      "displayName": "Elon Musk",
      "enabled": true,
      "includeRetweets": false,
      "includeReplies": false,
      "keywords": ["Tesla", "SpaceX"]
    }
  ],
  "settings": {
    "maxTweetsPerProfile": 10,
    "minIntervalMinutes": 5
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Rate Limiting**:
   - Check API limits in your Twitter API provider dashboard
   - Increase `SCRAPE_INTERVAL_MINUTES`
   - Reduce `MAX_TWEETS_PER_RUN`

2. **Slack Permissions**:
   - Ensure webhook URL is correct
   - Check bot has channel access
   - Verify channel name format (#channel)

3. **Database Issues**:
   - Check write permissions to data directory
   - Ensure sufficient disk space
   - Run cleanup to remove old data

4. **Network Issues**:
   - Check firewall settings
   - Verify proxy configuration
   - Test API endpoints manually

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm start

# Or in .env
LOG_LEVEL=debug
```

### Performance Optimization

For high-volume usage:

1. **Use Redis**:
   ```bash
   # Add Redis to docker-compose.yml
   # Update dbService to use Redis instead of file storage
   ```

2. **Increase Resources**:
   - AWS Lambda: Increase memory allocation
   - Docker: Add more CPU/memory limits
   - Server: Use more powerful instance

3. **Database Optimization**:
   - Use PostgreSQL/MySQL instead of file storage
   - Implement connection pooling
   - Add database indexes

## 🔒 Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use secure secret management
   - Rotate API keys regularly

2. **Network Security**:
   - Use HTTPS in production
   - Implement rate limiting
   - Add authentication for API endpoints

3. **Data Protection**:
   - Encrypt sensitive data
   - Implement data retention policies
   - Regular backups

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer**:
   - Use multiple instances behind a load balancer
   - Implement sticky sessions for database consistency

2. **Queue System**:
   - Use Redis/Bull for job queuing
   - Separate scraping and Slack sending processes

3. **Database Scaling**:
   - Use managed database service
   - Implement read replicas
   - Add caching layer

### Vertical Scaling

1. **Resource Allocation**:
   - Increase CPU/memory allocation
   - Use SSD storage
   - Optimize Node.js settings

2. **Code Optimization**:
   - Implement connection pooling
   - Add request caching
   - Optimize database queries

## 📞 Support

- Check logs for error details
- Review API provider documentation
- Test with minimal configuration first
- Use debug mode for troubleshooting 