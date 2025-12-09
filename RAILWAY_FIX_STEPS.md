# Fix Railway Deployment - Step by Step

## The Problem
Railway is trying to run `api.js` (which doesn't exist) instead of `server.js`, and `puppeteer` is missing.

## What I Fixed

✅ **Added `puppeteer` to `server/package.json`**  
✅ **Created `railway.json`** - Explicitly sets start command  
✅ **Created `Procfile`** - Backup start command  
✅ **Created `nixpacks.toml`** - Railway build configuration  
✅ **Updated `package.json`** - Added `main` field pointing to `server.js`

## Fix Steps in Railway

### Step 1: Update Railway Settings

1. **Go to Railway Dashboard:** https://railway.app/dashboard
2. **Select your service/project**
3. **Go to Settings tab**

### Step 2: Set Root Directory

1. **Scroll to "Root Directory"**
2. **Set to:** `server`
3. **Save**

### Step 3: Set Start Command

1. **Scroll to "Start Command"** (or "Deploy" section)
2. **Set to:** `node server.js`
3. **Or:** `npm start` (which runs `node server.js`)
4. **Save**

### Step 4: Check Environment Variables

Make sure you have:
```
PORT=3002
CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=your-password
NODE_ENV=production
```

### Step 5: Redeploy

1. **Go to Deployments tab**
2. **Click "Redeploy"** on the latest deployment
3. **Or:** Push a new commit to GitHub (if connected)

## Verify It Works

After redeploy, check the logs:

**✅ Good signs:**
- "Starting server on port..."
- "Server listening on..."
- No "Cannot find module" errors

**❌ Bad signs:**
- "Cannot find module 'puppeteer'" → Dependencies not installed
- "Cannot find module 'api.js'" → Wrong start command
- "Error: Cannot find module" → Missing dependency

## If Still Crashing

### Check 1: Verify package.json
```bash
cd server
cat package.json | grep puppeteer
```
Should show: `"puppeteer": "^24.22.3"`

### Check 2: Verify start command
In Railway Settings → Start Command should be:
- `node server.js` OR
- `npm start`

### Check 3: Check Root Directory
Railway Settings → Root Directory should be:
- `server`

### Check 4: Manual Install Test
Test locally:
```bash
cd server
npm install
npm start
```
Should start without errors.

## Alternative: Use Render Instead

If Railway keeps having issues:

1. **Go to:** https://render.com
2. **New → Web Service**
3. **Connect GitHub** or upload `server/` folder
4. **Settings:**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Node
5. **Environment Variables:** (same as Railway)
6. **Deploy**

## Files Created/Updated

- ✅ `server/package.json` - Added puppeteer, added main field
- ✅ `server/railway.json` - Railway config
- ✅ `server/Procfile` - Start command
- ✅ `server/nixpacks.toml` - Build config
- ✅ `server/.railwayignore` - Exclude api.cjs

After updating Railway settings and redeploying, it should work! 🚀

