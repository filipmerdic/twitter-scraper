# Deploy Twitter Scraper Frontend to Vercel

This guide will help you deploy your Twitter Scraper Frontend to Vercel in just a few minutes.

## 🚀 Quick Deploy (Recommended)

### Option 1: Deploy with GitHub Actions (Automatic)

1. **Set up Vercel secrets** in your GitHub repository:
   - Go to your repository: `https://github.com/filipmerdic/twitter-scraper`
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `VERCEL_TOKEN` - Your Vercel API token
     - `VERCEL_ORG_ID` - Your Vercel organization ID
     - `VERCEL_PROJECT_ID` - Your Vercel project ID

2. **Get Vercel credentials**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Get your tokens (run these commands)
   vercel whoami
   vercel projects ls
   ```

3. **Push to trigger deployment**:
   ```bash
   git push origin main
   ```

4. **Your frontend will be live** at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel Dashboard

1. **Go to [Vercel](https://vercel.com)** and sign in with GitHub
2. **Click "New Project"**
3. **Import your repository**: `filipmerdic/twitter-scraper`
4. **Configure the project**:
   - **Framework Preset**: Node.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm install`
   - **Output Directory**: `./` (leave as default)
   - **Install Command**: `npm install`
5. **Add Environment Variables**:
   ```
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   SCRAPE_INTERVAL_MINUTES=15
   NODE_ENV=production
   ```
6. **Click "Deploy"**

## 🔧 Environment Variables

Make sure to set these in your Vercel project settings:

### Required Variables
```bash
TWITTER_BEARER_TOKEN=your_twitter_api_bearer_token
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Optional Variables
```bash
SCRAPE_INTERVAL_MINUTES=15
NODE_ENV=production
PORT=3000
```

## 📁 Project Structure for Vercel

Vercel will automatically detect and deploy:
- `src/index.js` - Main server file
- `public/` - Static frontend files
- `api/` - API endpoints
- `vercel.json` - Vercel configuration

## 🌐 Your Frontend URL

After deployment, your frontend will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch-username.vercel.app`

## 🔄 Automatic Deployments

With GitHub Actions set up:
- **Every push to main** triggers a new deployment
- **Pull requests** create preview deployments
- **Environment variables** are automatically included

## 📊 Monitoring

Vercel provides:
- **Real-time logs** in the dashboard
- **Performance analytics**
- **Error tracking**
- **Uptime monitoring**

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails**:
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Vercel dashboard

2. **Environment variables missing**:
   - Add them in Vercel project settings
   - Redeploy after adding variables

3. **API endpoints not working**:
   - Check `vercel.json` configuration
   - Verify routes are correctly set up

4. **Frontend not loading**:
   - Check that `public/` files are included
   - Verify static file serving is configured

### Getting Help

- **Vercel Dashboard**: Check logs and analytics
- **GitHub Actions**: View deployment progress
- **Vercel CLI**: `vercel logs` for detailed logs

## 🎉 Success!

Once deployed, you can:
1. **Access your frontend** at the Vercel URL
2. **Add Twitter accounts** through the web interface
3. **Configure keywords** and settings
4. **Start monitoring** immediately

Your Twitter Scraper Frontend is now live and ready to use! 🚀 