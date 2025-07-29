# Twitter Scraper Frontend Deployment Guide

This guide will help you deploy the Twitter Scraper Frontend to various platforms.

## Quick Deploy Options

### 1. Railway (Recommended)

Railway is a simple platform for deploying Node.js applications.

1. **Fork this repository** to your GitHub account
2. **Go to [Railway](https://railway.app)** and sign in with GitHub
3. **Click "New Project"** → "Deploy from GitHub repo"
4. **Select your forked repository**
5. **Add environment variables**:
   ```
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   SCRAPE_INTERVAL_MINUTES=15
   ```
6. **Deploy!** Your frontend will be available at the provided URL

### 2. Render

Render is another great option for Node.js deployments.

1. **Fork this repository** to your GitHub account
2. **Go to [Render](https://render.com)** and sign up
3. **Click "New"** → "Web Service"
4. **Connect your GitHub repository**
5. **Configure the service**:
   - **Name**: `twitter-scraper-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Add environment variables** (same as Railway)
7. **Deploy!**

### 3. Heroku

1. **Install Heroku CLI** and login
2. **Create a new Heroku app**:
   ```bash
   heroku create your-app-name
   ```
3. **Add environment variables**:
   ```bash
   heroku config:set TWITTER_BEARER_TOKEN=your_token
   heroku config:set SLACK_WEBHOOK_URL=your_webhook
   heroku config:set SCRAPE_INTERVAL_MINUTES=15
   ```
4. **Deploy**:
   ```bash
   git push heroku main
   ```

### 4. Vercel

1. **Go to [Vercel](https://vercel.com)** and sign in with GitHub
2. **Import your repository**
3. **Configure the project**:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm install`
   - **Output Directory**: `.`
   - **Install Command**: `npm install`
4. **Add environment variables** in the Vercel dashboard
5. **Deploy!**

## Environment Variables

Make sure to set these environment variables in your deployment platform:

```bash
# Required
TWITTER_BEARER_TOKEN=your_twitter_api_bearer_token
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Optional
SCRAPE_INTERVAL_MINUTES=15
PORT=3000
NODE_ENV=production
```

## Manual Deployment

If you prefer to deploy manually:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/twitter-scraper.git
   cd twitter-scraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

5. **Access the frontend** at `http://localhost:3000`

## Docker Deployment

You can also deploy using Docker:

1. **Build the Docker image**:
   ```bash
   docker build -t twitter-scraper .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 \
     -e TWITTER_BEARER_TOKEN=your_token \
     -e SLACK_WEBHOOK_URL=your_webhook \
     twitter-scraper
   ```

## GitHub Actions Deployment

The repository includes a GitHub Actions workflow that:

1. **Tests the application** on multiple Node.js versions
2. **Creates a deployment package** with all necessary files
3. **Uploads artifacts** for manual deployment
4. **Provides deployment instructions** in the workflow summary

To use this:

1. **Push to main/master branch** to trigger the workflow
2. **Check the Actions tab** in your GitHub repository
3. **Download the deployment artifact** from the workflow run
4. **Deploy the artifact** to your preferred platform

## Post-Deployment Setup

After deploying:

1. **Access your frontend** at the provided URL
2. **Add Twitter accounts** to monitor using the web interface
3. **Configure keywords** and settings for each account
4. **Save changes** to start monitoring
5. **Check the logs** to ensure everything is working

## Troubleshooting

### Common Issues

1. **Frontend not loading**:
   - Check if the server is running on the correct port
   - Verify environment variables are set correctly
   - Check deployment platform logs

2. **API endpoints not working**:
   - Ensure the server has write permissions to `src/config/profiles.json`
   - Check that all required files are included in deployment

3. **Scraper not running**:
   - Verify Twitter API credentials are correct
   - Check Slack webhook URL is valid
   - Review server logs for error messages

### Getting Help

- Check the deployment platform's logs
- Review the application logs in your deployment dashboard
- Ensure all environment variables are set correctly
- Verify the `profiles.json` file is writable

## Security Considerations

- **Never commit API keys** to your repository
- **Use environment variables** for all sensitive data
- **Enable HTTPS** in production
- **Set up proper CORS** if needed
- **Regularly update dependencies** for security patches 