# Fix: Render Running Wrong File (api.js instead of server.js)

## The Problem

You're getting this error:
```
> pokemon-card-api@1.0.0 start
> node api.js
Error: Cannot find module 'puppeteer'
```

## The Issues

1. ❌ **Start Command is wrong** - It's running `node api.js` instead of `npm start`
2. ❌ **Wrong package.json** - It's using `pokemon-card-api@1.0.0` instead of `cardstax-api-server@1.0.0`

## Quick Fix

### Step 1: Go to Render Dashboard

1. **Go to:** https://dashboard.render.com
2. **Click on your service** (the one that's failing)

### Step 2: Fix Start Command

1. **Click "Settings" tab**
2. **Scroll to "Start Command"**
3. **Change it from:** `node api.js` ❌
4. **To:** `npm start` ✅
5. **Click "Save"**

### Step 3: Verify Build Command

While you're in Settings, also check:

1. **Scroll to "Build Command"**
2. **Should be:** `npm install`
3. **If different, change it to:** `npm install`
4. **Click "Save"**

### Step 4: Verify Root Directory

Also check:

1. **Scroll to "Root Directory"**
2. **Should be:** `server` (lowercase)
3. **If different, change it to:** `server`
4. **Click "Save"**

### Step 5: Redeploy

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

**Start Command:**
```
npm start
```
(Not `node api.js`!)

**Environment:**
```
Node
```

## Why This Happens

- **Render might auto-detect** `api.js` if it exists
- **Or Start Command was set incorrectly** during setup
- **Using `npm start`** ensures it uses the correct script from `package.json`

## After Fixing

After updating Start Command to `npm start` and redeploying, you should see:

**✅ Good:**
```
==> Running 'npm start'
> cardstax-api-server@1.0.0 start
> node server.js
🚀 Server running on http://0.0.0.0:10000
✅ Server ready!
```

**❌ Bad (what you're seeing now):**
```
==> Running 'npm start'
> pokemon-card-api@1.0.0 start
> node api.js
Error: Cannot find module 'puppeteer'
```

## Why puppeteer Error?

The puppeteer error happens because:
1. It's trying to run `api.js` (which requires puppeteer)
2. But `api.js` is the old file (we renamed it to `api.js.backup`)
3. The correct file is `server.js` (which has puppeteer in package.json)

**Once you fix Start Command to `npm start`, it will use `server.js` and puppeteer will be installed correctly.**

## Quick Checklist

Before redeploying, verify:

- [ ] Root Directory = `server` (lowercase)
- [ ] Build Command = `npm install`
- [ ] Start Command = `npm start` (NOT `node api.js`!)
- [ ] Environment = `Node`
- [ ] Environment variables are set

## Summary

**Change Start Command from `node api.js` to `npm start`!**

This will:
- ✅ Use the correct `server.js` file
- ✅ Use the correct `package.json` (cardstax-api-server)
- ✅ Install puppeteer correctly
- ✅ Run the server properly

🚀

