# URGENT: Railway Still Running api.js

## The Problem
Railway is STILL trying to run `api.js` and detecting `pokemon-card-api@1.0.0` instead of using `server.js` and `cardstax-api-server`.

This means **Railway is NOT using the `server/` directory as Root Directory**, or Railway settings haven't been updated.

## IMMEDIATE FIX - Do This NOW

### Step 1: Check Railway Root Directory

1. **Go to Railway Dashboard**
2. **Click on your service**
3. **Go to Settings tab**
4. **Scroll to "Root Directory"**
5. **Check what it says:**
   - ❌ If it's empty or `/` → **THIS IS THE PROBLEM!**
   - ✅ If it says `server` → Good, but check Step 2

### Step 2: Set Root Directory to `server`

1. **In Settings → Root Directory**
2. **Type:** `server` (exactly this, no slash, no quotes)
3. **Click "Save"**

### Step 3: Set Start Command

1. **In Settings → Scroll to "Deploy" section**
2. **Find "Start Command"**
3. **Clear any existing command** (delete everything)
4. **Type:** `node server.js` (exactly this)
5. **Click "Save"**

### Step 4: Check Build Command

1. **In Settings → "Build Command"**
2. **Should be:** `npm install --production=false`
3. **Or leave empty** (Railway will auto-detect)

### Step 5: Add Environment Variable

1. **Go to "Variables" tab**
2. **Add new variable:**
   - Key: `NPM_CONFIG_PRODUCTION`
   - Value: `false`
3. **Save**

### Step 6: Force Redeploy

1. **Go to "Deployments" tab**
2. **Click the three dots (⋯) on the latest deployment**
3. **Click "Redeploy"**
4. **OR delete the service and create a new one**

## Why It's Still Failing

The error shows:
```
> pokemon-card-api@1.0.0 start
> node api.js
```

This means Railway is:
1. **NOT using `server/` as Root Directory** (most likely)
2. **OR using a cached/old package.json**
3. **OR detecting a different package.json somewhere**

## Nuclear Option: Delete and Recreate

If settings don't work, delete and recreate:

1. **Delete the service** (Settings → Danger Zone → Delete)
2. **Create NEW service**
3. **Deploy from GitHub** (if connected):
   - Select your repo
   - **Set Root Directory:** `server`
   - **Set Start Command:** `node server.js`
4. **OR Upload `server/` folder manually**
5. **Add environment variables**
6. **Deploy**

## Verify Settings

After updating, your Railway settings should show:

- ✅ **Root Directory:** `server` (NOT empty, NOT `/`)
- ✅ **Start Command:** `node server.js` (NOT `node api.js`)
- ✅ **Build Command:** `npm install --production=false` (or empty)
- ✅ **Environment Variable:** `NPM_CONFIG_PRODUCTION=false`

## What Should Happen After Fix

After redeploy, logs should show:

**✅ Good:**
```
> cardstax-api-server@1.0.0 start
> node server.js
Server listening on port 3002
```

**❌ Bad (what you're seeing):**
```
> pokemon-card-api@1.0.0 start
> node api.js
Error: Cannot find module 'puppeteer'
```

## Files I Created

- ✅ `server/api.js` - Error file that exits if Railway tries to run it
- ✅ `server/railway.json` - Railway config
- ✅ `server/railway.toml` - Alternative Railway config
- ✅ `server/Procfile` - Start command backup
- ✅ `server/nixpacks.toml` - Build config

**The key is setting Root Directory to `server` in Railway dashboard!**

