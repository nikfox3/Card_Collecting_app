# Check Railway Logs to Find the Crash Cause

## Step 1: View Railway Logs

1. **Go to Railway Dashboard**
2. **Click on your service**
3. **Click "Logs" tab**
4. **Scroll to the bottom** (most recent logs)

## What to Look For

The logs will show you exactly why it crashed. Common errors:

### Error 1: Missing Environment Variables
```
Error: JWT_SECRET is required
Error: ADMIN_PASSWORD is required
```
**Fix:** Add missing environment variables in Railway Variables tab

### Error 2: Database Error
```
Error: ENOENT: no such file or directory, open '/app/cards.db'
Error: SQLITE_CANTOPEN: unable to open database file
```
**Fix:** Database will be created automatically. If it fails, check file permissions.

### Error 3: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3002
```
**Fix:** Railway assigns PORT automatically. Make sure you're using `process.env.PORT`.

### Error 4: Missing Module
```
Error: Cannot find module 'puppeteer'
Error: Cannot find module 'sqlite3'
```
**Fix:** Dependencies not installed. Check build logs.

### Error 5: Route/Import Error
```
Error: Cannot find module './routes/auth.js'
Error: Cannot resolve './utils/database.js'
```
**Fix:** File structure issue. Check Root Directory is set to `server`.

## Step 2: Check Build Logs

1. **Go to "Deployments" tab**
2. **Click on the latest deployment**
3. **Check "Build Logs"**

Look for:
- ✅ `npm install` succeeded
- ✅ All dependencies installed
- ❌ Any errors during build

## Step 3: Common Fixes Based on Logs

### If Database Error:
Add to Railway Variables:
```
DATABASE_PATH=/tmp/cards.db
```

### If Missing Dependencies:
Check build logs. If `puppeteer` or `sqlite3` failed to install, you might need to:
- Add `NPM_CONFIG_PRODUCTION=false` to Variables
- Or use a different Node version

### If Port Error:
Railway automatically sets `PORT`. Make sure your code uses `process.env.PORT`.

### If Import/Route Error:
Check that Root Directory is set to `server` in Railway settings.

## Step 4: Share the Error

Once you see the error in logs, you can:
1. Copy the error message
2. Share it with me
3. I'll provide a specific fix

## Quick Test

After checking logs and fixing issues:

1. **Redeploy** in Railway
2. **Check logs** again
3. **Test health endpoint:**
   ```bash
   curl https://your-railway-url.railway.app/health
   ```

Should return:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "...",
  "port": 3002,
  "environment": "production"
}
```

## Most Likely Issues

Based on the crash after successful deployment:

1. **Missing environment variables** (JWT_SECRET, ADMIN_PASSWORD, CORS_ORIGIN)
2. **Database path issue** (fixed in updated config.js)
3. **Port binding issue** (fixed in updated server.js)

Check the logs to see which one it is!

