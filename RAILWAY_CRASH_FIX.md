# Fix Railway Crash After Successful Deployment

## The Problem
Deployment succeeded but then crashed. This usually means:
1. ✅ Railway is now using the correct files (`server.js`)
2. ❌ But there's a runtime error (missing env vars, database, port binding, etc.)

## Common Causes

### 1. Missing Environment Variables
Railway needs these environment variables:

**Required:**
```
PORT=3002
NODE_ENV=production
JWT_SECRET=your-random-secret-key-here
ADMIN_PASSWORD=your-admin-password
CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
```

**Optional (but recommended):**
```
DATABASE_PATH=/app/cards.db
NPM_CONFIG_PRODUCTION=false
```

### 2. Database File Missing
The server expects a database file. Railway will create it automatically, but you might need to:
- Upload `cards.db` to Railway (if you have one)
- Or let the server create it on first run

### 3. Port Binding
Railway assigns a port via `PORT` environment variable. The server now uses this correctly.

## Fix Steps

### Step 1: Check Railway Logs

1. **Go to Railway Dashboard**
2. **Click on your service**
3. **Go to "Logs" tab**
4. **Look for error messages** - this will tell you exactly what's wrong

Common errors:
- `Error: Cannot find module` → Missing dependency
- `EADDRINUSE` → Port already in use
- `ENOENT: no such file or directory` → Missing file/database
- `ECONNREFUSED` → Database connection failed

### Step 2: Add Missing Environment Variables

1. **Go to Railway Dashboard → Your Service → Variables tab**
2. **Add these variables:**

```
PORT=3002
NODE_ENV=production
JWT_SECRET=your-random-secret-key-change-this
ADMIN_PASSWORD=your-secure-password
CORS_ORIGIN=https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
NPM_CONFIG_PRODUCTION=false
```

**Important:** 
- Replace `your-random-secret-key-change-this` with a random string
- Replace `your-secure-password` with a secure password
- Replace the CORS_ORIGIN with your actual Vercel URL

### Step 3: Check Database

The server will try to create the database automatically. If it fails:

1. **Check logs** for database errors
2. **The database path** defaults to `../cards.db` (relative to server/)
3. **Railway might need** the database in a writable location

### Step 4: Redeploy

1. **After adding environment variables**
2. **Go to Deployments tab**
3. **Click "Redeploy"**

## What I Fixed in server.js

✅ **Added error handling** for database initialization  
✅ **Added error handling** for static file serving  
✅ **Added process error handlers** (uncaughtException, unhandledRejection)  
✅ **Improved port binding** (uses Railway's PORT env var)  
✅ **Better logging** for debugging

## Verify It Works

After redeploy, check logs. You should see:

**✅ Good:**
```
✅ Database initialized successfully
🚀 Server running on http://0.0.0.0:3002
✅ Server ready!
```

**❌ Bad:**
```
Error: Cannot find module '...'
Error: EADDRINUSE: address already in use
Error: ENOENT: no such file or directory
```

## If Still Crashing

### Check 1: Railway Logs
Look at the exact error message in Railway logs - it will tell you what's wrong.

### Check 2: Environment Variables
Make sure all required environment variables are set in Railway.

### Check 3: Database
If database errors, the server will continue but some features won't work. Check if database file needs to be uploaded.

### Check 4: Dependencies
If `puppeteer` or other dependencies fail, check Railway build logs to see if installation succeeded.

## Quick Test

After deployment, test the health endpoint:
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

## Next Steps

1. **Check Railway logs** for the exact error
2. **Add missing environment variables**
3. **Redeploy**
4. **Test the health endpoint**
5. **Update Vercel** with the Railway API URL

After fixing, your API should be running! 🚀

