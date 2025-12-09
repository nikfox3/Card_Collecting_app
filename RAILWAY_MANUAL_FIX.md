# Manual Fix for Railway - Critical Steps

## The Problem
Railway is detecting `api.cjs` and trying to run it as `api.js`, ignoring your `server.js` file.

## Immediate Fix in Railway Dashboard

### Step 1: Go to Railway Settings

1. **Open Railway Dashboard:** https://railway.app/dashboard
2. **Click on your service** (the one that's crashing)
3. **Click "Settings" tab**

### Step 2: Set Root Directory (CRITICAL)

1. **Scroll to "Root Directory"**
2. **Set it to:** `server`
3. **Click "Save"**

**This is the most important step!** If Root Directory is wrong, Railway will look in the wrong place.

### Step 3: Set Start Command (CRITICAL)

1. **Scroll to "Deploy" section**
2. **Find "Start Command"**
3. **Clear any existing command**
4. **Set to:** `node server.js`
5. **Click "Save"**

**Do NOT use:** `npm start` or `node api.js`

### Step 4: Check Build Settings

1. **In Settings, find "Build Command"**
2. **Set to:** `npm install`
3. **Or leave empty** (Railway will auto-detect)

### Step 5: Environment Variables

Make sure these are set in **Variables** tab:

```
PORT=3002
CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
JWT_SECRET=your-secret-key-here
ADMIN_PASSWORD=your-password
NODE_ENV=production
```

### Step 6: Redeploy

1. **Go to "Deployments" tab**
2. **Click the three dots (⋯) on the latest deployment**
3. **Click "Redeploy"**
4. **Wait for deployment**

## Verify Settings

After updating, your Railway settings should show:

- ✅ **Root Directory:** `server`
- ✅ **Start Command:** `node server.js`
- ✅ **Build Command:** `npm install` (or auto)
- ✅ **Environment Variables:** All set

## What Should Happen

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

## If It Still Fails

### Option 1: Delete and Recreate Service

1. **Delete the current service** in Railway
2. **Create new service**
3. **Deploy from GitHub** (if connected)
4. **Set Root Directory:** `server`
5. **Set Start Command:** `node server.js`
6. **Add environment variables**
7. **Deploy**

### Option 2: Use Render Instead

If Railway keeps having issues:

1. **Go to:** https://render.com
2. **New → Web Service**
3. **Connect GitHub** or upload `server/` folder
4. **Settings:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. **Add environment variables**
6. **Deploy**

Render is often more reliable for Node.js apps.

## Quick Checklist

Before redeploying, verify:

- [ ] Root Directory = `server` (not empty, not `/`)
- [ ] Start Command = `node server.js` (exactly this)
- [ ] Build Command = `npm install` (or auto)
- [ ] Environment variables set
- [ ] `server/package.json` has `puppeteer` in dependencies
- [ ] `server/package.json` has `"start": "node server.js"`

## Files Updated (Already Done)

- ✅ `server/package.json` - Added puppeteer, set main to server.js
- ✅ `server/railway.json` - Railway config
- ✅ `server/nixpacks.toml` - Build config
- ✅ `server/Procfile` - Start command
- ✅ `server/.railwayignore` - Exclude api.cjs

**The key is setting Root Directory and Start Command correctly in Railway dashboard!**

