# Fix: Root Directory Set But Still Can't Find server.js

## The Problem
Root Directory is set to `server`, but Railway still can't find `server.js`. This is likely a **Start Command** issue.

## Quick Fix: Use npm start

Instead of `node server.js`, use `npm start` which uses the script from `package.json`.

### Step 1: Update Start Command in Railway

1. **Go to Railway Dashboard → Your Service → Settings**
2. **Scroll to "Deploy" section**
3. **Find "Start Command"**
4. **Change it to:** `npm start`
5. **Click "Save"**

### Step 2: Redeploy

1. **Go to Deployments tab**
2. **Click "Redeploy"**

## Why This Works

Your `package.json` has:
```json
"scripts": {
  "start": "node server.js"
}
```

Using `npm start` ensures:
- ✅ Railway runs the correct script
- ✅ Uses the working directory correctly
- ✅ Respects the Root Directory setting

## Alternative: Check What Railway Sees

If `npm start` doesn't work, temporarily use a debug command:

1. **Change Start Command to:**
   ```bash
   ls -la && pwd && cat package.json | grep start && npm start
   ```
2. **Redeploy**
3. **Check logs** - this will show:
   - What files are in the directory
   - Current working directory
   - The start script from package.json
   - Then try to run it

## Verify Files Are Committed

Make sure your files are committed to GitHub:

1. **Check if `server/server.js` is in your GitHub repo**
2. **If not, commit and push:**
   ```bash
   git add server/
   git commit -m "Add server files"
   git push
   ```
3. **Then redeploy in Railway**

## Most Likely Solution

**Change Start Command from `node server.js` to `npm start`**

This is the most common fix when Root Directory is correct but files aren't found.

## After Fixing

After changing to `npm start` and redeploying, you should see:

**✅ Good:**
```
> cardstax-api-server@1.0.0 start
> node server.js
🚀 Server running on http://0.0.0.0:3002
```

**❌ Bad (what you're seeing now):**
```
Error: Cannot find module '/app/server.js'
```

Try `npm start` first - this usually fixes it! 🚀

