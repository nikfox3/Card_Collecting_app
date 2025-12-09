# Deploy API Server - Quick Guide

## Recommended: Railway (Easiest)

### Step 1: Prepare Server for Deployment

1. **Create `server/.env.example`:**
   ```env
   PORT=3002
   CORS_ORIGIN=https://your-pwa.vercel.app
   JWT_SECRET=your-secret-key-change-this
   ADMIN_PASSWORD=your-admin-password
   DATABASE_PATH=./cards.db
   NODE_ENV=production
   ```

2. **Update `server/config.js` to handle production:**
   - Already configured to use environment variables ✅

### Step 2: Deploy to Railway

1. **Sign up:** https://railway.app (free tier available)

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or "Empty Project")

3. **If using GitHub:**
   - Connect your repository
   - Set **Root Directory:** `server`
   - Railway will auto-detect Node.js

4. **If deploying manually:**
   - Click "New" → "GitHub Repo"
   - Select your repo
   - In settings, set **Root Directory** to `server`

5. **Configure environment variables:**
   - Go to Variables tab
   - Add:
     ```
     PORT=3002
     CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
     JWT_SECRET=generate-a-random-secret-key-here
     ADMIN_PASSWORD=your-secure-password
     NODE_ENV=production
     ```

6. **Deploy:**
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Get your API URL (e.g., `https://your-api.railway.app`)

### Step 3: Update Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your `cardstax` project

2. **Add Environment Variable:**
   - Settings → Environment Variables
   - Add:
     - Name: `VITE_API_URL`
     - Value: `https://your-api.railway.app` (from Railway)
     - Environments: Production, Preview, Development

3. **Redeploy:**
   ```bash
   npm run deploy:vercel
   ```

## Alternative: Render

1. **Sign up:** https://render.com
2. **New → Web Service**
3. **Connect GitHub** or upload `server/` folder
4. **Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. **Environment Variables:** (same as Railway)
6. **Deploy** and get URL

## Test Your Setup

1. **Check API is running:**
   - Visit: `https://your-api.railway.app/api/health` (if you have a health endpoint)
   - Or: `https://your-api.railway.app/api/sets` (should return data)

2. **Check PWA:**
   - Visit your Vercel URL
   - Open browser console
   - Check for API errors
   - Should see API calls going to your Railway URL

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Include `https://` in the URL

### Database Issues
- Railway provides persistent storage
- Your `cards.db` file will be in the Railway filesystem
- Consider using Railway's database service for production

### Port Issues
- Railway assigns a port automatically
- Your server should use `process.env.PORT` (already configured ✅)

## Quick Commands

```bash
# Deploy API to Railway (after setup)
# Just push to GitHub, Railway auto-deploys

# Update Vercel environment variable
# Via dashboard or:
vercel env add VITE_API_URL production

# Redeploy PWA
npm run deploy:vercel
```

Your API will then be accessible from your deployed PWA! 🚀

