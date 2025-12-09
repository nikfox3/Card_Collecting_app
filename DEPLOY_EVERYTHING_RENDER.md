# Deploy Everything to Render (Frontend + Backend)

## Why Render for Everything?

- ✅ **One platform** - Frontend and backend together
- ✅ **Simple interface** - Easy to manage
- ✅ **Free tier** - Both services free
- ✅ **Auto-deploy** - From GitHub
- ✅ **No code changes** - Works as-is

## Step-by-Step Guide

### Part 1: Deploy Frontend (PWA) to Render

#### Step 1: Create Static Site

1. **Go to:** https://render.com
2. **Sign up** (free) or log in
3. **Click "New +"**
4. **Select "Static Site"**

#### Step 2: Connect GitHub

1. **Click "Connect GitHub"** (if not connected)
2. **Authorize Render**
3. **Select your repository:** `nikfox3/Card_Collecting_app`

#### Step 3: Configure Frontend

**Fill in these settings:**

**Name:**
```
cardstax-pwa
```

**Branch:**
```
main
```

**Root Directory:**
```
(leave empty - root of repo)
```

**Build Command:**
```
npm install && npm run build
```

**Publish Directory:**
```
dist
```

#### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add:
- **Key:** `VITE_API_URL`  
  **Value:** `https://cardstax-api.onrender.com`  
  (We'll update this after deploying backend)

#### Step 5: Deploy Frontend

1. **Scroll down**
2. **Click "Create Static Site"**
3. **Wait 2-3 minutes**
4. **Copy your frontend URL** (e.g., `https://cardstax-pwa.onrender.com`)

---

### Part 2: Deploy Backend (API) to Render

#### Step 1: Create Web Service

1. **Still in Render dashboard**
2. **Click "New +"**
3. **Select "Web Service"**

#### Step 2: Connect GitHub

1. **Select same repository:** `nikfox3/Card_Collecting_app`

#### Step 3: Configure Backend

**Fill in these settings:**

**Name:**
```
cardstax-api
```

**Environment:**
```
Node
```

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

**Node Version:**
```
20
```
(Or leave default)

#### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

1. **Key:** `NODE_ENV`  
   **Value:** `production`

2. **Key:** `PORT`  
   **Value:** `10000`  
   (Render auto-assigns, but this is backup)

3. **Key:** `JWT_SECRET`  
   **Value:** `your-random-secret-key`  
   (Replace with random string)

4. **Key:** `ADMIN_PASSWORD`  
   **Value:** `your-password`  
   (Choose secure password)

5. **Key:** `CORS_ORIGIN`  
   **Value:** `https://cardstax-pwa.onrender.com`  
   (Your frontend URL from Part 1)

6. **Key:** `DATABASE_PATH`  
   **Value:** `/opt/render/project/src/cards.db`

#### Step 5: Deploy Backend

1. **Scroll down**
2. **Click "Create Web Service"**
3. **Wait 2-3 minutes**
4. **Copy your API URL** (e.g., `https://cardstax-api.onrender.com`)

---

### Part 3: Connect Frontend to Backend

#### Step 1: Update Frontend Environment Variable

1. **Go to Render dashboard**
2. **Click on your frontend service** (`cardstax-pwa`)
3. **Go to "Environment" tab**
4. **Find `VITE_API_URL`**
5. **Update value** to your backend URL: `https://cardstax-api.onrender.com`
6. **Save**
7. **Render will auto-redeploy**

#### Step 2: Update Backend CORS

1. **Go to backend service** (`cardstax-api`)
2. **Go to "Environment" tab**
3. **Verify `CORS_ORIGIN`** matches your frontend URL
4. **If different, update and save**

---

### Part 4: Test Everything

#### Test Frontend

1. **Visit your frontend URL:** `https://cardstax-pwa.onrender.com`
2. **Should load your PWA**

#### Test Backend

1. **Visit:** `https://cardstax-api.onrender.com/health`
2. **Should return:** `{"status":"ok",...}`

#### Test Connection

1. **Open frontend in browser**
2. **Try logging in or using features**
3. **Check browser console** for API calls
4. **Should work!**

---

## Benefits of Everything on Render

✅ **One dashboard** - Manage both in one place  
✅ **Same platform** - Consistent experience  
✅ **Easy updates** - Push to GitHub, auto-deploy  
✅ **Free tier** - Both services free  
✅ **Simple** - No complex configuration  

## Render Free Tier Limits

- ✅ **750 hours/month** (enough for always-on)
- ✅ **100GB bandwidth/month**
- ✅ **Auto-sleep** after 15 min inactivity (wakes on request)
- ⚠️ **First request** after sleep takes ~30 seconds

**For production, consider paid plan ($7/month) to avoid sleep.**

## Troubleshooting

### Frontend Not Loading

1. **Check build logs** - Look for errors
2. **Verify build command** - Should be `npm run build`
3. **Check publish directory** - Should be `dist`

### Backend Not Working

1. **Check logs** - Look for errors
2. **Verify environment variables** - All set?
3. **Check CORS_ORIGIN** - Matches frontend URL?

### API Not Connecting

1. **Check `VITE_API_URL`** in frontend environment
2. **Check `CORS_ORIGIN`** in backend environment
3. **Verify both URLs** are correct
4. **Check browser console** for CORS errors

## Summary

**Deploying everything to Render is simple:**

1. ✅ **Deploy frontend** (Static Site) - 5 minutes
2. ✅ **Deploy backend** (Web Service) - 5 minutes
3. ✅ **Connect them** - 2 minutes
4. ✅ **Done!** - 12 minutes total

**Everything in one place, super simple!** 🚀

