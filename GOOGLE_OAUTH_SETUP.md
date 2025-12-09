# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Card Collecting App.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to the Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `email` and `profile`
   - Add test users if needed (for testing before verification)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Card Collecting App`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:3001`
     - (Add your production URLs when deploying)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback`
     - (Add your production callback URL when deploying)
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env` file in the `server` directory (or root directory) with:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Important:** Never commit the `.env` file to version control. It should be in `.gitignore`.

## Step 3: Install Dependencies

The Google OAuth dependencies are already installed:
- `googleapis` package (installed in `server/`)

## Step 4: Test the Integration

1. Start the API server:
   ```bash
   npm run api:dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to the login or signup page
4. Click "Continue with Google"
5. You should be redirected to Google's consent screen
6. After authorizing, you'll be redirected back and logged in

## How It Works

1. **User clicks "Continue with Google"** → Frontend requests OAuth URL from backend
2. **Backend generates OAuth URL** → Returns Google authorization URL
3. **User authorizes** → Google redirects to callback URL with authorization code
4. **Backend exchanges code for tokens** → Gets user info from Google
5. **Backend creates/updates user** → Creates session token
6. **Backend redirects to frontend** → With session token in URL
7. **Frontend verifies token** → Logs user in and redirects to main app

## Database Schema

The `users` table has been updated to support OAuth:
- `google_id` (VARCHAR, UNIQUE) - Google user ID
- `oauth_provider` (VARCHAR) - Provider name (e.g., 'google')
- `password_hash` (VARCHAR, nullable) - Null for OAuth-only users

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3001/api/auth/google/callback`
- Check that the `GOOGLE_REDIRECT_URI` in `.env` matches

### "invalid_client" Error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes in the `.env` file

### "access_denied" Error
- User may have denied permission
- Check OAuth consent screen configuration

### Token Verification Fails
- Check that the API server is running
- Verify the session token is being passed correctly
- Check server logs for errors

## Production Deployment

When deploying to production:

1. Update Google OAuth credentials:
   - Add production URLs to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs
   - Update `.env` with production URLs

2. Update environment variables:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. Ensure HTTPS is enabled (required by Google OAuth)

4. Submit OAuth consent screen for verification (if using external users)

## Security Notes

- Never expose `GOOGLE_CLIENT_SECRET` in client-side code
- Use environment variables for all sensitive credentials
- Enable HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Cloud Console

