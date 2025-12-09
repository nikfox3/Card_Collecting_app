# Fix: Render Root Directory Error

## The Problem

You're getting this error:
```
Service Root Directory "/opt/render/project/src/Server" is missing.
```

## The Issue

**Root Directory is set to `Server` (capital S) but your folder is `server` (lowercase s).**

On Render (Linux), file paths are **case-sensitive**, so `Server` ≠ `server`.

## Quick Fix

### Step 1: Go to Render Dashboard

1. **Go to:** https://dashboard.render.com
2. **Click on your service** (the one that's failing)

### Step 2: Update Root Directory

1. **Click "Settings" tab**
2. **Scroll to "Root Directory"**
3. **Change it from:** `Server` ❌
4. **To:** `server` ✅ (lowercase!)
5. **Click "Save"**

### Step 3: Redeploy

1. **Go to "Events" or "Deployments" tab**
2. **Click "Manual Deploy" → "Deploy latest commit"**
3. **Wait for deployment**

## Verify It's Correct

After updating, your Root Directory should be:
- ✅ `server` (lowercase, exactly this)
- ❌ NOT `Server` (capital S)
- ❌ NOT `SERVER` (all caps)
- ❌ NOT `/server` (no leading slash)
- ❌ NOT `server/` (no trailing slash)

## Why This Happens

- **Your local folder:** `server/` (lowercase)
- **Render is case-sensitive:** `Server` ≠ `server`
- **Must match exactly:** `server`

## After Fixing

After setting Root Directory to `server` (lowercase) and redeploying, you should see:

**✅ Good:**
```
==> Cloning from https://github.com/nikfox3/Card_Collecting_app
==> Building...
==> Installing dependencies...
==> Starting service...
```

**❌ Bad (what you're seeing now):**
```
==> Service Root Directory "/opt/render/project/src/Server" is missing.
```

## Quick Checklist

Before redeploying, verify:

- [ ] Root Directory = `server` (lowercase, no slashes)
- [ ] Start Command = `npm start`
- [ ] Build Command = `npm install`
- [ ] Environment variables are set

## If Still Failing

If it still fails after fixing:

1. **Check your GitHub repo** - Make sure `server/` folder exists
2. **Check branch** - Make sure you're deploying from `main` branch
3. **Check logs** - Look for other errors

## Summary

**Change Root Directory from `Server` to `server` (lowercase)!**

That's it! Just change the capital S to lowercase s. 🚀

