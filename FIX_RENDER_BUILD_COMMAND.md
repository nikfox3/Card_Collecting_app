# Fix: Render Build Command Error

## The Problem

You're getting this error:
```
npm error Missing script: "build"
```

## The Issue

**Render is trying to run `npm run build` but your `server/package.json` doesn't have a `build` script.**

The server only needs `npm install` - no build step required!

## Quick Fix

### Step 1: Go to Render Dashboard

1. **Go to:** https://dashboard.render.com
2. **Click on your service** (the one that's failing)

### Step 2: Update Build Command

1. **Click "Settings" tab**
2. **Scroll to "Build Command"**
3. **Change it from:** `npm install; npm run build` ❌
4. **To:** `npm install` ✅
5. **Click "Save"**

### Step 3: Verify Start Command

While you're in Settings, also check:

1. **Scroll to "Start Command"**
2. **Should be:** `npm start`
3. **If different, change it to:** `npm start`
4. **Click "Save"**

### Step 4: Redeploy

1. **Go to "Events" or "Deployments" tab**
2. **Click "Manual Deploy" → "Deploy latest commit"**
3. **Wait for deployment**

## Correct Settings

After fixing, your Render settings should be:

**Root Directory:**
```
server
```

**Build Command:**
```
npm install
```
(Just this, nothing else!)

**Start Command:**
```
npm start
```

**Environment:**
```
Node
```

## Why This Happens

- **Frontend apps** need `npm run build` to create production files
- **Backend/API servers** don't need a build step - they just run directly
- **Your server** uses `node server.js` directly, no build needed

## After Fixing

After updating Build Command to `npm install` and redeploying, you should see:

**✅ Good:**
```
==> Running build command 'npm install'...
added 219 packages, and audited 220 packages
found 0 vulnerabilities
==> Build successful!
==> Starting service...
> cardstax-api-server@1.0.0 start
> node server.js
🚀 Server running on http://0.0.0.0:10000
```

**❌ Bad (what you're seeing now):**
```
==> Running build command 'npm install; npm run build'...
npm error Missing script: "build"
==> Build failed 😞
```

## Quick Checklist

Before redeploying, verify:

- [ ] Root Directory = `server` (lowercase)
- [ ] Build Command = `npm install` (just this!)
- [ ] Start Command = `npm start`
- [ ] Environment = `Node`
- [ ] Environment variables are set

## Summary

**Change Build Command from `npm install; npm run build` to just `npm install`!**

The server doesn't need a build step - it runs directly with Node.js. 🚀

