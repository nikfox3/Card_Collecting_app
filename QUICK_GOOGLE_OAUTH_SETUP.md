# Quick Google OAuth Setup Guide

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in App name, User support email, Developer contact
   - Click **Save and Continue**
   - Add scopes: `email` and `profile`
   - Click **Save and Continue**
   - Add test users (your email) if needed
   - Click **Save and Continue**
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Card Collecting App` (or any name)
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs:**
     - `http://localhost:3001/api/auth/google/callback`
   - Click **Create**
5. Copy your **Client ID** and **Client Secret**

## Step 2: Add Credentials to .env File

Edit `server/.env` and replace the placeholder values:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace with your actual values from Step 1!

## Step 3: Restart the API Server

After updating the `.env` file, restart the server:

```bash
# Stop the current server
pkill -f "node server.js"

# Start it again
npm run api:dev
```

## Step 4: Test

1. Go to the login or signup page
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back and logged in

## Troubleshooting

- **"Google OAuth not configured"**: Make sure you've replaced the placeholder values in `server/.env` and restarted the server
- **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console exactly matches: `http://localhost:3001/api/auth/google/callback`
- **"invalid_client"**: Check that your Client ID and Client Secret are correct (no extra spaces or quotes)

## Need Help?

See `GOOGLE_OAUTH_SETUP.md` for more detailed instructions.

