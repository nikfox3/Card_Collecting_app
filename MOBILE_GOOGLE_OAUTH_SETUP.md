# Mobile Device Google OAuth Setup

When accessing the app from a mobile device on your local network, you need to configure Google OAuth to work properly.

## Problem

Google OAuth fails on mobile devices because:
1. Google **does not allow IP addresses** (like `192.168.1.240`) in redirect URIs
2. Google only allows `localhost`, `127.0.0.1`, or valid domain names
3. Mobile devices need a way to access your local server

## Solution: Use ngrok (Recommended)

ngrok creates a secure tunnel from a public URL to your local server, allowing Google OAuth to work with mobile devices.

### Step 1: Install ngrok

1. **Download ngrok:**
   - Go to https://ngrok.com/download
   - Download for your platform (Mac, Windows, Linux)
   - Or use Homebrew on Mac: `brew install ngrok`

2. **Sign up for a free account** (required for custom domains):
   - Go to https://dashboard.ngrok.com/signup
   - Get your authtoken from the dashboard

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Step 2: Start ngrok Tunnel

Start a tunnel pointing to your API server (port 3001):

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://YOUR_NGROK_URL/api/auth/google/callback
   ```
   For example: `https://abc123.ngrok-free.app/api/auth/google/callback`

4. **Important:** Add BOTH:
   - `http://localhost:3001/api/auth/google/callback` (for localhost access)
   - `https://YOUR_NGROK_URL/api/auth/google/callback` (for mobile access via ngrok)

5. Under "Authorized JavaScript origins", add:
   ```
   https://YOUR_NGROK_URL
   ```

### Step 4: Configure Environment Variables

Edit `server/.env`:

```env
GOOGLE_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/google/callback
FRONTEND_URL=https://YOUR_NGROK_URL
```

Replace `YOUR_NGROK_URL` with your actual ngrok URL (e.g., `abc123.ngrok-free.app`)

### Step 5: Start Your Servers

1. **Start ngrok** (in one terminal):
   ```bash
   ngrok http 3001
   ```

2. **Start API server** (in another terminal):
   ```bash
   cd server
   npm run dev
   ```

3. **Start frontend** (in another terminal):
   ```bash
   npm run dev
   ```

### Step 6: Access from Mobile Device

1. Make sure your mobile device has internet access
2. Access the app using your ngrok URL: `https://YOUR_NGROK_URL`
3. Try Google OAuth login - it should work!

## Alternative Solution: Use ngrok for Frontend Too

If you want to use ngrok for the frontend as well:

1. Start ngrok for frontend (port 3000):
   ```bash
   ngrok http 3000
   ```

2. Use the frontend ngrok URL on your mobile device

3. Update `FRONTEND_URL` in `server/.env` to match your frontend ngrok URL

## Important Notes

- **ngrok free tier:** The URL changes each time you restart ngrok (unless you have a paid plan)
- **Update Google Console:** If your ngrok URL changes, update it in Google Cloud Console
- **HTTPS:** ngrok provides HTTPS automatically, which is required for OAuth
- **Security:** ngrok URLs are public - only use for development, not production

### Step 4: Restart the API Server

After making changes, restart the API server:

```bash
cd server
npm run dev
```

### Step 5: Access from Mobile Device

1. Make sure your mobile device is on the same Wi-Fi network
2. Access the app using: `http://YOUR_IP_ADDRESS:3000`
3. Try Google OAuth login

## Troubleshooting

### Error: "redirect_uri_mismatch"

This means the redirect URI in the request doesn't match what's registered in Google Cloud Console.

**Solution:**
1. Check the server logs - it will show the redirect URI being used
2. Make sure that exact URI is registered in Google Cloud Console
3. The redirect URI must match EXACTLY (including `http://` vs `https://`)

### Error: "Google OAuth not configured"

This means the environment variables are not set correctly.

**Solution:**
1. Check `server/.env` file exists
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Restart the API server after changing `.env`

### Error: "No authorization code received"

This usually means:
1. User cancelled the OAuth flow
2. Redirect URI mismatch
3. Network connectivity issues

**Solution:**
1. Check server logs for the exact redirect URI
2. Verify it's registered in Google Cloud Console
3. Try again with better network connection

## Dynamic IP Addresses

If your IP address changes frequently (DHCP), you have two options:

### Option 1: Use a Static IP (Recommended)
Configure your router to assign a static IP to your development machine.

### Option 2: Add Multiple Redirect URIs
Add all possible IP addresses to Google Cloud Console. This is less secure but works for development.

## Testing

1. Check server logs when initiating OAuth - it will show:
   ```
   🔐 Google OAuth redirect URI: http://192.168.1.100:3001/api/auth/google/callback
   ```

2. Verify this exact URI is in Google Cloud Console

3. After successful OAuth, check logs for:
   ```
   ✅ Redirecting to frontend: http://192.168.1.100:3000/auth/google/success?token=...
   ```

## Security Note

For production, use HTTPS and a fixed domain name. The dynamic IP detection is only for local development.

