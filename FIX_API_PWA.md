# Fix API Server for Deployed PWA

## Problem
Your PWA is deployed to Vercel, but the API server is running locally. The deployed PWA can't access `localhost:3002`.

## Solution Options

### Option 1: Deploy API Server to Production (Recommended)

You need to deploy your API server to a hosting service. Here are the best options:

#### A. Railway (Easiest - Recommended)
1. **Sign up:** https://railway.app
2. **Create new project**
3. **Connect GitHub repo** (or deploy from folder)
4. **Set root directory:** `server`
5. **Set start command:** `npm start`
6. **Add environment variables:**
   - `PORT=3002` (or let Railway assign)
   - `CORS_ORIGIN=https://your-pwa-url.vercel.app`
   - `JWT_SECRET=your-secret-key`
   - `ADMIN_PASSWORD=your-admin-password`
7. **Deploy** - Railway will give you a URL like `https://your-api.railway.app`

#### B. Render
1. **Sign up:** https://render.com
2. **Create new Web Service**
3. **Connect repo** or upload `server/` folder
4. **Configure:**
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: Node
5. **Add environment variables** (same as Railway)
6. **Deploy** - Get URL like `https://your-api.onrender.com`

#### C. Heroku
1. **Sign up:** https://heroku.com
2. **Install Heroku CLI:** `npm install -g heroku`
3. **Login:** `heroku login`
4. **Create app:** `cd server && heroku create your-api-name`
5. **Deploy:** `git push heroku main`
6. **Set environment variables:** `heroku config:set CORS_ORIGIN=https://your-pwa.vercel.app`

### Option 2: Use Vercel Serverless Functions (Advanced)

Convert your API to Vercel serverless functions. This is more complex but keeps everything on Vercel.

### Option 3: Temporary - Use Your Public IP (Not Recommended for Production)

If you just want to test:
1. Find your public IP: https://whatismyipaddress.com
2. Configure your router to forward port 3002
3. Set `VITE_API_URL=http://YOUR_PUBLIC_IP:3002` in Vercel

**⚠️ Warning:** This exposes your local server to the internet. Not secure for production.

## Configure Vercel Environment Variables

Once you have your API server deployed:

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Select your project:** `cardstax`
3. **Go to Settings → Environment Variables**
4. **Add:**
   - Name: `VITE_API_URL`
   - Value: `https://your-api.railway.app` (or your API URL)
   - Environment: Production, Preview, Development
5. **Redeploy:**
   ```bash
   npm run deploy:vercel
   ```

## Quick Test

After setting up:

1. Deploy API server (Railway/Render/Heroku)
2. Set `VITE_API_URL` in Vercel
3. Redeploy PWA
4. Test the deployed PWA

## Current Status

- ✅ PWA deployed to Vercel
- ❌ API server still local
- ⏳ Need to deploy API server

## Next Steps

1. Choose a hosting service (Railway recommended)
2. Deploy your `server/` folder
3. Get the API URL
4. Set `VITE_API_URL` in Vercel
5. Redeploy PWA

Your API will then work in the deployed PWA! 🚀

