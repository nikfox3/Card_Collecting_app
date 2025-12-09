# Fix Railway Deployment Crash

## Problem
Railway is trying to run `api.js` instead of `server.js`, and `puppeteer` is missing.

## What I Fixed

1. ✅ **Added `puppeteer` to dependencies** in `server/package.json`
2. ✅ **Created `railway.json`** to explicitly set start command
3. ✅ **Created `Procfile`** as backup for Railway detection
4. ✅ **Created `.railwayignore`** to exclude `api.cjs` from deployment

## Next Steps

### Option 1: Redeploy on Railway (Recommended)

1. **Go to Railway dashboard**
2. **Select your service**
3. **Go to Settings → Deploy**
4. **Click "Redeploy"** or push a new commit to GitHub

Railway should now:
- Install `puppeteer` (now in package.json)
- Run `server.js` (via railway.json/Procfile)
- Not try to run `api.cjs`

### Option 2: Update Railway Settings

If redeploy doesn't work:

1. **Go to Railway dashboard**
2. **Select your service**
3. **Go to Settings**
4. **Check "Start Command":**
   - Should be: `npm start` or `node server.js`
   - If it says `node api.js`, change it to `node server.js`
5. **Redeploy**

### Option 3: Manual Fix in Railway

1. **Go to Railway dashboard**
2. **Select your service**
3. **Go to Variables tab**
4. **Add/Check:**
   - `NPM_CONFIG_PRODUCTION=false` (to install all deps including puppeteer)
5. **Go to Settings → Deploy**
6. **Set Start Command:** `node server.js`
7. **Redeploy**

## Verify It Works

After redeploy, check Railway logs:
- Should see: "Starting server on port 3002" (or Railway's assigned port)
- Should NOT see: "Cannot find module 'puppeteer'"
- Should NOT see: "Error: Cannot find module 'api.js'"

## If Still Having Issues

1. **Check Railway logs** for exact error
2. **Verify package.json** has `puppeteer` in dependencies
3. **Verify start command** is `node server.js`
4. **Check Root Directory** is set to `server` in Railway settings

## Files Updated

- ✅ `server/package.json` - Added puppeteer dependency
- ✅ `server/railway.json` - Railway configuration
- ✅ `server/Procfile` - Start command backup
- ✅ `server/.railwayignore` - Exclude api.cjs

After redeploying, your API server should start correctly! 🚀

