# 🚀 Connect Your PWA to the API

## ✅ Your URLs

- **PWA (Frontend):** https://cardstax.vercel.app
- **API (Backend):** https://card-collecting-app.onrender.com

## 📋 Step-by-Step: Add Environment Variable

### Step 1: Open Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find and click on your project: **cardstax**

### Step 2: Add Environment Variable
1. Click **Settings** (in the top navigation)
2. Click **Environment Variables** (in the left sidebar)
3. Click **Add New** button
4. Fill in:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://card-collecting-app.onrender.com`
   - **Environment:** 
     - ✅ Check **Production**
     - ✅ Check **Preview** (optional, but recommended)
     - ✅ Check **Development** (optional)
5. Click **Save**

### Step 3: Redeploy Your PWA
After adding the environment variable, you must redeploy:

**Option A: Via Dashboard (Easiest)**
1. Click **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Confirm the redeploy

**Option B: Via Command Line**
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run deploy:vercel
```

### Step 4: Wait for Deployment
- Wait 1-2 minutes for the redeploy to complete
- You'll see a green checkmark when it's done

### Step 5: Test the Connection
1. Visit: https://cardstax.vercel.app
2. Open Browser DevTools (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Try to log in or use the app
5. Check for API calls in the **Network** tab

**✅ Success indicators:**
- No CORS errors in console
- API calls show status 200
- Login works
- Data loads correctly

## 🔍 Verify It's Working

### Test 1: Check Environment Variable
```bash
# Via Vercel CLI
npx vercel env ls

# Should show:
# VITE_API_URL (Production, Preview, Development)
```

### Test 2: Check API Health
Visit in browser:
- https://card-collecting-app.onrender.com/health

Should return:
```json
{"status":"ok","message":"Server is running","timestamp":"..."}
```

### Test 3: Check PWA Console
1. Visit: https://cardstax.vercel.app
2. Open DevTools → Console
3. Look for:
   - ✅ No errors about API URL
   - ✅ API calls succeeding
   - ✅ Data loading

## 🐛 Troubleshooting

### Problem: API calls still failing after redeploy

**Solution 1: Check Environment Variable**
- Go to Vercel → Settings → Environment Variables
- Make sure `VITE_API_URL` is set correctly
- Make sure it's enabled for **Production**

**Solution 2: Clear Browser Cache**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

**Solution 3: Check CORS**
- The API should allow `*.vercel.app` domains
- This is already configured ✅

**Solution 4: Check API is Running**
- Visit: https://card-collecting-app.onrender.com/health
- Should return `{"status":"ok"}`

### Problem: Environment variable not showing up

**Solution:**
- Make sure you saved it
- Make sure it's enabled for the right environment (Production)
- Redeploy after adding it

## 📊 Quick Reference

| What | URL | Status |
|------|-----|--------|
| **PWA** | https://cardstax.vercel.app | ⏳ Needs env var |
| **API** | https://card-collecting-app.onrender.com | ✅ Running |

## 🎯 After Setup

Once the environment variable is set and the PWA is redeployed:

1. ✅ Your PWA will connect to the API
2. ✅ Users can log in
3. ✅ Data will load from the API
4. ✅ Everything will work! 🎉

---

**Quick Command to Add Env Var (Alternative):**
```bash
npx vercel env add VITE_API_URL production
# When prompted, enter: https://card-collecting-app.onrender.com
```

Then redeploy!

