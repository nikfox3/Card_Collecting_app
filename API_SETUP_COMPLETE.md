# API Server Setup - Complete Instructions

## Current Situation

✅ **PWA deployed:** https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app  
❌ **API server:** Still running locally (not accessible from deployed PWA)  
✅ **Code updated:** API detection now handles Vercel deployments

## Solution: Deploy API Server

You have 2 main options:

### Option 1: Railway (Recommended - Free & Easy)

**Step-by-step:**

1. **Sign up at Railway:**
   - Visit: https://railway.app
   - Sign up with GitHub (easiest)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Card_Collecting_app` repository

3. **Configure Project:**
   - After connecting, click on the service
   - Go to **Settings**
   - Set **Root Directory:** `server`
   - Railway will auto-detect it's a Node.js app

4. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add these variables:
     ```
     PORT=3002
     CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
     JWT_SECRET=generate-a-random-string-here-min-32-chars
     ADMIN_PASSWORD=your-secure-admin-password
     NODE_ENV=production
     DATABASE_PATH=./cards.db
     ```
   - **Generate JWT_SECRET:** Use a random string generator or:
     ```bash
     openssl rand -base64 32
     ```

5. **Deploy:**
   - Railway will automatically deploy when you push to GitHub
   - Or click "Deploy" button
   - Wait for deployment (2-3 minutes)

6. **Get Your API URL:**
   - After deployment, Railway shows your URL
   - Example: `https://your-api-name.railway.app`
   - **Copy this URL!**

7. **Update Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your `cardstax` project
   - Go to **Settings → Environment Variables**
   - Click **Add New**
   - Name: `VITE_API_URL`
   - Value: `https://your-api-name.railway.app` (from Railway)
   - Select all environments: Production, Preview, Development
   - Click **Save**

8. **Redeploy PWA:**
   ```bash
   npm run deploy:vercel
   ```

9. **Test:**
   - Visit your PWA URL
   - Open browser console
   - Check for API errors
   - Try using the app

### Option 2: Render (Alternative)

1. **Sign up:** https://render.com
2. **New → Web Service**
3. **Connect GitHub** or upload `server/` folder
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. **Environment Variables:** (same as Railway)
6. **Deploy** and get URL
7. **Update Vercel** with the Render URL

## Quick Test with ngrok (Temporary)

If you want to test quickly without deploying:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start API server:**
   ```bash
   cd server
   npm run dev
   ```

3. **In another terminal:**
   ```bash
   ngrok http 3002
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Set in Vercel:**
   - Dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://abc123.ngrok.io`
   - Redeploy

**⚠️ Note:** ngrok free tier has session limits. Use Railway for production.

## Verify Everything Works

1. **Check API is accessible:**
   - Visit: `https://your-api.railway.app/api/sets`
   - Should return JSON data (or an error page, but should be accessible)

2. **Check PWA:**
   - Visit: https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
   - Open browser console (F12)
   - Look for API calls
   - Should see requests going to your Railway URL

3. **Test functionality:**
   - Try logging in
   - Try searching for cards
   - Check if data loads

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Include `https://` in the URL
- Server code updated to allow `*.vercel.app` domains ✅

### API Not Responding
- Check Railway logs: Railway dashboard → Deployments → View logs
- Verify environment variables are set correctly
- Check that `PORT` is set (Railway assigns automatically, but verify)

### Database Issues
- Railway provides persistent storage
- Your `cards.db` will be in Railway's filesystem
- For production, consider using Railway's PostgreSQL service

## Summary

**What's Done:**
- ✅ PWA deployed to Vercel
- ✅ API URL detection updated for Vercel
- ✅ Server CORS updated to allow Vercel domains
- ✅ Code ready for production API

**What You Need to Do:**
1. Deploy API server to Railway (or Render)
2. Set `VITE_API_URL` in Vercel
3. Redeploy PWA
4. Test!

**Time Required:** ~15 minutes

See `QUICK_API_FIX.md` for the fastest path, or `DEPLOY_API_SERVER.md` for detailed instructions.

