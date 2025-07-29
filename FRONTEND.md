# Twitter Scraper Frontend

A simple web interface for managing Twitter accounts and keywords to monitor.

## Features

- **Add Twitter Accounts**: Add new Twitter usernames with display names and keywords
- **Manage Keywords**: Set specific keywords to filter tweets for each account
- **Account Settings**: Configure whether to include retweets and replies
- **Enable/Disable Accounts**: Toggle monitoring for specific accounts
- **Remove Accounts**: Delete accounts from the monitoring list
- **Real-time Updates**: Changes are saved to the profiles.json file and will be picked up by the scraper

## Getting Started

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## How to Use

### Adding a New Account

1. Fill in the form with:
   - **Username**: The Twitter handle (without @)
   - **Display Name**: A friendly name for the account
   - **Keywords**: Comma-separated keywords to filter tweets
   - **Include Retweets**: Check to include retweets in monitoring
   - **Include Replies**: Check to include replies in monitoring

2. Click "Add Account" to add it to the list
3. Click "Save All Changes" to persist the changes

### Managing Existing Accounts

- **Enable/Disable**: Click the toggle button to enable or disable monitoring
- **Remove**: Click "Remove" to delete an account from the list
- **View Details**: See keywords and settings for each account

### Saving Changes

- Changes are stored locally until you click "Save All Changes"
- The save button shows an asterisk (*) when there are unsaved changes
- After saving, the scraper will use the updated configuration on its next run

## API Endpoints

The frontend uses these API endpoints:

- `GET /api/profiles` - Get all profiles
- `PUT /api/profiles` - Update profiles

## File Structure

```
public/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
└── script.js       # JavaScript functionality

api/
└── profiles.js     # API handlers for profiles

src/config/
└── profiles.json   # Profile configuration (auto-updated)
```

## Configuration

The frontend automatically reads from and writes to `src/config/profiles.json`. This file is used by the scraper to determine which accounts to monitor.

### Profile Structure

```json
{
  "profiles": [
    {
      "username": "example_user",
      "displayName": "Example User",
      "enabled": true,
      "includeRetweets": false,
      "includeReplies": false,
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "settings": {
    "defaultIncludeRetweets": false,
    "defaultIncludeReplies": false,
    "maxTweetsPerProfile": 10,
    "minIntervalMinutes": 5
  }
}
```

## Troubleshooting

- **Can't save changes**: Make sure the server has write permissions to `src/config/profiles.json`
- **Frontend not loading**: Check that the server is running on port 3000
- **API errors**: Check the server logs for detailed error messages

## Development

To modify the frontend:

1. Edit files in the `public/` directory
2. The server automatically serves static files
3. Refresh your browser to see changes

The frontend uses vanilla JavaScript and CSS - no build process required! 