#!/bin/bash

# Twitter Scraper Frontend Deployment Script
# This script commits and pushes changes to trigger GitHub Actions deployment

set -e

echo "🚀 Starting Twitter Scraper Frontend Deployment..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit"
    echo "💡 If you want to trigger a deployment, make some changes first"
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current branch: $CURRENT_BRANCH"

# Add all changes
echo "📝 Adding changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Deploy Twitter Scraper Frontend

- Add web-based account management interface
- Create API endpoints for profile management
- Add modern, responsive UI with real-time updates
- Include deployment automation with GitHub Actions
- Update documentation and deployment guides

Features:
✅ Add/Remove Twitter accounts via web interface
✅ Manage keywords and settings per account
✅ Enable/Disable account monitoring
✅ Real-time configuration updates
✅ Beautiful, modern UI design"

# Push changes
echo "🚀 Pushing to remote..."
git push origin $CURRENT_BRANCH

echo ""
echo "✅ Deployment triggered successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Check GitHub Actions tab for deployment progress"
echo "2. Download deployment artifacts when ready"
echo "3. Deploy to your preferred platform (Railway, Render, Heroku, etc.)"
echo "4. Set up environment variables (Twitter API key, Slack webhook)"
echo "5. Access your frontend and start adding Twitter accounts!"
echo ""
echo "📚 For detailed deployment instructions, see DEPLOYMENT.md"
echo "🌐 For frontend usage guide, see FRONTEND.md" 