# Step-by-Step PWA Deployment

Follow these steps in order to deploy your CardStax PWA.

## 📋 Pre-Deployment Checklist

Before starting, make sure you have:
- [x] PWA manifest configured ✅
- [x] Service worker configured ✅
- [x] Apple iOS meta tags ✅
- [ ] Icon files (we'll create these in Step 1)

---

## Step 1: Create Icon Files (5-10 minutes)

### Method 1: Online Tool (Easiest)

1. **Prepare your logo:**
   - You have: `public/Assets/CardStax_logo_light.svg`
   - Convert to PNG: Open in image editor, export as 512x512 PNG
   - Save as: `public/icon-source.png`

2. **Generate icons:**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Click "Choose File" → Select `icon-source.png`
   - Click "Generate"
   - Download the ZIP file
   - Extract all PNG files to `public/` folder

3. **Verify:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   ls public/icon-*.png
   ```
   You should see multiple icon files.

### Method 2: Command Line (Automated)

1. **Install tool:**
   ```bash
   npm install -g pwa-asset-generator
   ```

2. **Create source icon:**
   - Convert SVG to 512x512 PNG: `public/icon-source.png`

3. **Generate:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   pwa-asset-generator public/icon-source.png public/ --icon-only --favicon
   ```

4. **Verify:**
   ```bash
   ls public/icon-*.png
   ```

---

## Step 2: Build Your App (1 minute)

1. **Navigate to project:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Verify build:**
   ```bash
   ls dist/
   ```
   
   You should see:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `assets/` folder
   - Icon files

4. **Test locally (optional):**
   ```bash
   npm run preview
   ```
   Visit `http://localhost:3000` to test

---

## Step 3: Deploy to Vercel (Recommended - 5 minutes)

### Initial Setup (First Time Only)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```
   - Browser will open
   - Sign in with GitHub/Email
   - Return to terminal

### Deploy

1. **Deploy:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   vercel --prod
   ```

2. **First time setup:**
   - "Set up and deploy?": **Y**
   - "Which scope?": Select your account
   - "Link to existing project?": **N**
   - "Project name": `cardstax` (or your choice)
   - "Directory": `dist`
   - "Override settings?": **N**

3. **Get your URL:**
   - Vercel will output: `https://cardstax.vercel.app`
   - **Save this URL!** This is your PWA URL.

### Future Deployments

After initial setup, just run:
```bash
npm run deploy:vercel
```

Or manually:
```bash
npm run build
vercel --prod
```

---

## Step 4: Deploy to Netlify (Alternative - 5 minutes)

### Initial Setup

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

### Deploy

1. **Deploy:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   npm run deploy:netlify
   ```

2. **First time setup:**
   - "Create & configure a new site?": **Y**
   - "Team": Select your team
   - "Site name": `cardstax` (or your choice)
   - "Publish directory": `dist`

3. **Get your URL:**
   - Netlify will output: `https://cardstax.netlify.app`
   - **Save this URL!**

### Configure SPA Routing

1. **Create redirect file:**
   ```bash
   echo "/*    /index.html   200" > public/_redirects
   ```

2. **Rebuild and redeploy:**
   ```bash
   npm run build
   npm run deploy:netlify
   ```

---

## Step 5: Test Your PWA (5 minutes)

### Test on Android

1. **Open Chrome** on your Android device
2. **Navigate** to your deployed URL (e.g., `https://cardstax.vercel.app`)
3. **Wait for install prompt:**
   - Chrome may show: "Add CardStax to Home Screen"
   - Or: Tap menu (⋮) → "Add to Home Screen"
4. **Install:**
   - Tap "Add" or "Install"
   - App icon appears on home screen
5. **Test:**
   - Open app from home screen
   - Should open in standalone mode (no browser UI)
   - Turn off WiFi → App should still work (offline mode)

### Test on iOS

1. **Open Safari** on iPhone/iPad (must use Safari, not Chrome)
2. **Navigate** to your deployed URL
3. **Add to Home Screen:**
   - Tap Share button (square with arrow)
   - Scroll down → Tap "Add to Home Screen"
   - Edit name if needed → Tap "Add"
4. **Test:**
   - Open app from home screen
   - Should open in standalone mode
   - Test offline functionality

---

## Step 6: Validate Your PWA (5 minutes)

### Using PWA Builder

1. **Visit:** https://www.pwabuilder.com/
2. **Enter your URL:** `https://cardstax.vercel.app`
3. **Click "Start"**
4. **Review results:**
   - Check score (aim for 100+)
   - Review any warnings
   - Fix any issues shown

### Using Lighthouse

1. **Open Chrome** on desktop
2. **Navigate** to your deployed URL
3. **Open DevTools:** F12 or Right-click → Inspect
4. **Go to Lighthouse tab**
5. **Select:**
   - Categories: ✅ Progressive Web App
   - Device: Mobile
6. **Click "Generate report"**
7. **Review:**
   - PWA score (aim for 90+)
   - Check installable status
   - Review recommendations

### Using Chrome DevTools

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Check:**
   - **Manifest:** Should show all icons and details
   - **Service Workers:** Should show "activated and running"
   - **Storage:** Should show cached files

---

## Step 7: Custom Domain (Optional - 10 minutes)

### Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Select your project**
3. **Go to Settings → Domains**
4. **Add domain:** Enter your domain (e.g., `cardstax.com`)
5. **Follow DNS instructions:**
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → Vercel IP (shown in dashboard)
6. **Wait for DNS propagation** (5-60 minutes)
7. **SSL certificate** is automatic

### Netlify

1. **Go to:** https://app.netlify.com/
2. **Select your site**
3. **Go to Domain settings**
4. **Add custom domain**
5. **Follow DNS instructions**
6. **SSL certificate** is automatic

---

## Troubleshooting

### Icons Not Showing

**Check:**
```bash
ls public/icon-*.png
ls dist/icon-*.png
```

**Fix:**
- Ensure icons are in `public/` folder
- Rebuild: `npm run build`
- Verify icons copied to `dist/`

### Service Worker Not Working

**Check:**
- Must be HTTPS (or localhost)
- Open DevTools → Application → Service Workers
- Check for errors in Console

**Fix:**
- Verify `sw.js` exists in `dist/`
- Check browser console for errors
- Ensure HTTPS is enabled

### App Won't Install

**Android:**
- Must use Chrome browser
- Must be HTTPS
- Check manifest.json is valid

**iOS:**
- Must use Safari (not Chrome)
- Must be HTTPS
- Check Apple meta tags

### 404 Errors on Refresh

**Fix:**
- Vercel: Should work automatically
- Netlify: Add `public/_redirects` file (see Step 4)
- Custom server: Configure SPA routing

---

## Quick Reference Commands

```bash
# Build
npm run build

# Deploy to Vercel
npm run deploy:vercel
# or
vercel --prod

# Deploy to Netlify
npm run deploy:netlify
# or
netlify deploy --prod --dir=dist

# Test locally
npm run preview

# Check build
ls dist/
```

---

## Next Steps After Deployment

1. ✅ **Share your PWA URL** with users
2. ✅ **Monitor usage** (Vercel/Netlify analytics)
3. ✅ **Update app** (rebuild and redeploy)
4. ✅ **Add custom domain** (optional)
5. ✅ **Submit to app stores** (optional, using PWA Builder)

---

## Summary

**Total time:** ~20-30 minutes

1. **Icons:** 5-10 min (one-time)
2. **Build:** 1 min
3. **Deploy:** 5 min
4. **Test:** 5 min
5. **Validate:** 5 min

**Your PWA is now live!** 🎉

Users can install it on Android and iOS devices.

