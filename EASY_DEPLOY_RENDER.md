# Easy Deployment Guide - Use Render Instead

## Why Render?
- ✅ **Much simpler** than Railway
- ✅ **More reliable** - fewer crashes
- ✅ **Free tier** available
- ✅ **Easier setup** - just connect GitHub

## Step-by-Step: Deploy to Render (10 minutes)

### Step 1: Sign Up for Render
1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest way)
4. Authorize Render to access your GitHub

### Step 2: Create New Web Service
1. In Render dashboard, click **"New +"**
2. Click **"Web Service"**
3. Select **"Connect GitHub"** (if not already connected)
4. Find and select your repository: **`nikfox3/Card_Collecting_app`**

### Step 3: Configure Service
Fill in these settings:

**Name:**
```
cardstax-api
```

**Root Directory:**
```
server
```

**Environment:**
```
Node
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Node Version:**
```
20
```
(Or leave default)

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

1. **Key:** `NODE_ENV`  
   **Value:** `production`

2. **Key:** `PORT`  
   **Value:** `10000`  
   (Render uses 10000, but it auto-assigns - this is just in case)

3. **Key:** `JWT_SECRET`  
   **Value:** `your-random-secret-key-change-this`  
   (Replace with a random string like: `abc123xyz789secret`)

4. **Key:** `ADMIN_PASSWORD`  
   **Value:** `your-password-here`  
   (Choose a secure password)

5. **Key:** `CORS_ORIGIN`  
   **Value:** `https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app`  
   (Your Vercel URL)

6. **Key:** `DATABASE_PATH`  
   **Value:** `/opt/render/project/src/cards.db`

### Step 5: Deploy
1. Scroll down
2. Click **"Create Web Service"**
3. Wait 2-3 minutes for deployment
4. ✅ Done!

### Step 6: Get Your API URL
1. After deployment completes, you'll see a URL like:
   ```
   https://cardstax-api.onrender.com
   ```
2. **Copy this URL** - you'll need it for Vercel

### Step 7: Update Vercel with API URL
1. Go to: **https://vercel.com/dashboard**
2. Select your **cardstax** project
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://cardstax-api.onrender.com` (your Render URL)
   - **Environments:** Production, Preview, Development
5. **Save**
6. **Redeploy** your Vercel project

## That's It! 🎉

Your API is now running on Render, and your PWA will connect to it.

## Troubleshooting

### If deployment fails:
1. Check **Logs** tab in Render
2. Look for error messages
3. Most common: Missing environment variables - make sure you added all 6

### If API doesn't work:
1. Test the health endpoint:
   ```
   https://your-api.onrender.com/health
   ```
2. Should return JSON with `"status": "ok"`

### If you need to update:
- Just push to GitHub
- Render auto-deploys on push to `main` branch

## Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Free Tier | ✅ Yes | ✅ Yes |
| Setup Time | 5-10 min | 15-30 min |

**Render is much easier!** Try it now! 🚀

