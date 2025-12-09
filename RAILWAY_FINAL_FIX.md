# Final Fix for Railway - api.cjs Issue

## The Problem
Railway keeps trying to run `api.js` (which doesn't exist) instead of `server.js`. This is because Railway is auto-detecting `api.cjs` and trying to run it.

## What I Just Fixed

✅ **Renamed `api.cjs` to `api.cjs.backup`** - Railway can't detect it anymore  
✅ **Updated `.railwayignore`** - Excludes api.cjs files  
✅ **Updated `railway.json`** - Forces production=false to install puppeteer  
✅ **Updated `nixpacks.toml`** - Ensures puppeteer is installed  
✅ **Updated `package.json`** - Added engines and postinstall script

## CRITICAL: Update Railway Settings NOW

### Step 1: Delete and Recreate Service (Recommended)

Railway might have cached the old configuration. The cleanest fix:

1. **Go to Railway Dashboard**
2. **Delete the current service** (Settings → Danger Zone → Delete)
3. **Create a NEW service**
4. **Deploy from GitHub** (if connected) OR **Upload server/ folder**
5. **In Settings:**
   - **Root Directory:** `server`
   - **Start Command:** `node server.js`
   - **Build Command:** (leave empty or `npm install`)
6. **Add Environment Variables:**
   ```
   PORT=3002
   CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
   JWT_SECRET=your-secret-key
   ADMIN_PASSWORD=your-password
   NODE_ENV=production
   ```
7. **Deploy**

### Step 2: OR Update Existing Service

If you want to keep the existing service:

1. **Go to Railway Dashboard → Your Service → Settings**
2. **Root Directory:** Set to `server` (if not already)
3. **Start Command:** Clear it, then set to `node server.js`
4. **Build Command:** Set to `npm install --production=false`
5. **Go to Variables tab:**
   - Add `NPM_CONFIG_PRODUCTION=false` (if not exists)
6. **Go to Deployments tab**
7. **Click "Redeploy"** on the latest deployment
8. **Wait for deployment**

## Verify It Works

After redeploy, check the logs. You should see:

**✅ Good:**
```
> cardstax-api-server@1.0.0 start
> node server.js
Server listening on port 3002
```

**❌ Bad (what you're seeing now):**
```
> pokemon-card-api@1.0.0 start
> node api.js
Error: Cannot find module 'puppeteer'
```

## Why This Will Work

1. **`api.cjs` is renamed** - Railway can't auto-detect it anymore
2. **`railway.json` explicitly sets** `node server.js` as start command
3. **`nixpacks.toml` ensures** puppeteer is installed
4. **`package.json` has correct** name and start script

## If It Still Fails

### Check 1: Verify Root Directory
In Railway Settings → Root Directory should be exactly: `server`

### Check 2: Verify Start Command
In Railway Settings → Start Command should be exactly: `node server.js`

### Check 3: Check Logs
Look at the build logs to see:
- Which package.json is being used
- What start command is being executed
- If puppeteer is being installed

### Check 4: Try Render Instead
If Railway keeps having issues, use Render:
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub or upload `server/` folder
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables
6. Deploy

## Files Changed

- ✅ `server/api.cjs` → `server/api.cjs.backup` (renamed)
- ✅ `server/.railwayignore` - Updated to exclude api.cjs
- ✅ `server/railway.json` - Updated build command
- ✅ `server/nixpacks.toml` - Added puppeteer check
- ✅ `server/package.json` - Added engines

**After updating Railway settings and redeploying, it should work!** 🚀

