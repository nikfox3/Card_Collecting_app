# Quick Deploy Guide - Get Started in 5 Minutes

## Fastest Path to Deploy Your PWA

### Step 1: Generate Icons (2 minutes)

**Easiest method - use online tool:**

1. Go to: https://www.pwabuilder.com/imageGenerator
2. Upload your CardStax logo (or create a 512x512 PNG)
3. Download the generated package
4. Extract all PNG files to `public/` folder

**Or use command line:**
```bash
npm install -g pwa-asset-generator
pwa-asset-generator public/icon-source.png public/ --icon-only
```

### Step 2: Build (30 seconds)

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run build
```

### Step 3: Deploy to Vercel (2 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login (opens browser)
vercel login

# Deploy
vercel --prod
```

**That's it!** You'll get a URL like `https://cardstax.vercel.app`

### Step 4: Test (1 minute)

1. Open the URL on your phone
2. Android: Chrome → Menu → "Add to Home Screen"
3. iOS: Safari → Share → "Add to Home Screen"

## Done! 🎉

Your PWA is now live and installable on Android and iOS.

For detailed instructions, see `COMPLETE_PWA_DEPLOYMENT_GUIDE.md`

