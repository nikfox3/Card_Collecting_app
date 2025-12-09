# Fix Google OAuth Redirect URI Mismatch Error

## Problem
You're getting this error:
```
Error 400: redirect_uri_mismatch
```

This means the redirect URI being sent to Google doesn't match what's configured in your Google Cloud Console.

## Current Situation
- Your server is using: `http://localhost:3002/api/auth/google/callback`
- Your .env file has ngrok URLs (which are being ignored)
- Google Cloud Console needs to have the matching redirect URI configured

## Solution

### Option 1: Add Localhost Redirect URI to Google Cloud Console (Recommended for Development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
3. Under "Authorized redirect URIs", click "ADD URI"
4. Add these redirect URIs:
   - `http://localhost:3002/api/auth/google/callback`
   - `http://127.0.0.1:3002/api/auth/google/callback` (optional, if you access via IP)
5. Click "SAVE"

### Option 2: Set a Specific Redirect URI in Environment Variables

If you want to use a specific redirect URI (like for production), update your `server/.env` file:

```bash
# Remove or comment out the ngrok URLs
# GOOGLE_REDIRECT_URI=https://unratified-dayana-unstimulatingly.ngrok-free.dev/api/auth/google/callback
# FRONTEND_URL=https://unratified-dayana-unstimulatingly.ngrok-free.dev

# Add your production redirect URI (if you have a domain)
# GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

Then add that exact URI to Google Cloud Console.

### Option 3: For Production with a Domain

If you have a production domain:

1. Update `server/.env`:
   ```bash
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   ```

2. Add to Google Cloud Console:
   - `https://yourdomain.com/api/auth/google/callback`

## Quick Fix Steps

1. **Open Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth client**: Look for one with ID starting with `439850520601...`
3. **Click "EDIT"** (pencil icon)
4. **Scroll to "Authorized redirect URIs"**
5. **Add**: `http://localhost:3002/api/auth/google/callback`
6. **Click "SAVE"**
7. **Wait 1-2 minutes** for Google to update
8. **Try logging in again**

## Verify

After adding the redirect URI, you can verify it's working by checking the server logs. You should see:
```
🔐 Google OAuth redirect URI: http://localhost:3002/api/auth/google/callback
```

And no more redirect_uri_mismatch errors!

## Notes

- The server automatically builds the redirect URI from the request if no valid one is in the .env file
- Ngrok URLs are ignored because they change frequently
- Multiple redirect URIs can be added to Google Cloud Console (one per environment)



