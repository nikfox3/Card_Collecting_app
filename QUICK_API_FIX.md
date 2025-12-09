# Quick Fix: API Server for PWA

## The Problem
Your PWA is deployed but can't connect to the API because it's trying to use `localhost:3002`, which doesn't work from a deployed website.

## Quick Solution (2 Options)

### Option 1: Deploy API Server (Recommended - 10 minutes)

**Using Railway (Easiest):**

1. **Go to:** https://railway.app
2. **Sign up** (free)
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repo**
5. **In project settings:**
   - Set **Root Directory:** `server`
   - Railway auto-detects Node.js
6. **Add Environment Variables:**
   ```
   PORT=3002
   CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
   JWT_SECRET=your-random-secret-key-here
   ADMIN_PASSWORD=your-password
   NODE_ENV=production
   ```
7. **Deploy** - Railway gives you a URL like `https://your-api.railway.app`

8. **Update Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select `cardstax` project
   - Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-api.railway.app`
   - Redeploy: `npm run deploy:vercel`

### Option 2: Temporary - Use ngrok (For Testing Only)

**Quick test without deploying:**

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # Or download from: https://ngrok.com
   ```

2. **Start your API server:**
   ```bash
   cd server
   npm run dev
   ```

3. **In another terminal, create tunnel:**
   ```bash
   ngrok http 3002
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Set in Vercel:**
   - Dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://abc123.ngrok.io`
   - Redeploy

**⚠️ Note:** ngrok free tier has limitations. Use Railway for production.

## After Setup

1. ✅ API server deployed (Railway) or tunneled (ngrok)
2. ✅ `VITE_API_URL` set in Vercel
3. ✅ PWA redeployed
4. ✅ Test your PWA - API should work!

## Verify It Works

1. Open your PWA: https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
2. Open browser console (F12)
3. Check for API errors
4. Try using the app - API calls should work

## Current Status

- ✅ PWA deployed
- ✅ API URL detection updated for Vercel
- ⏳ Need to deploy API server (Railway recommended)
- ⏳ Need to set `VITE_API_URL` in Vercel

See `DEPLOY_API_SERVER.md` for detailed Railway setup instructions.

