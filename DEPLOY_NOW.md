# Deploy Your PWA Now - Fixed Commands

## ✅ No Global Installation Needed!

I've fixed the permission issue. You can now deploy without installing anything globally.

## Quick Deploy (3 Steps)

### Step 1: Build (if not already done)
```bash
npm run build
```

### Step 2: Deploy to Vercel
```bash
npm run deploy:vercel
```

**First time only:**
- Browser will open for login
- Sign in with GitHub/Email
- Return to terminal
- Follow prompts:
  - "Set up and deploy?": **Y**
  - "Link to existing project?": **N**
  - "Project name": `cardstax` (or your choice)
  - "Directory": `dist`

**You'll get a URL like:** `https://cardstax.vercel.app`

### Step 3: Test
1. Open the URL on your phone
2. Android: Chrome → Menu → "Add to Home Screen"
3. iOS: Safari → Share → "Add to Home Screen"

## Alternative: Deploy to Netlify

```bash
npm run deploy:netlify
```

**First time only:**
- Browser will open for login
- Sign in with GitHub/Email
- Follow prompts to create site

## What Changed?

- ✅ No `npm install -g` needed
- ✅ Uses `npx` automatically (no permission issues)
- ✅ Commands work immediately

## Troubleshooting

### "npx vercel: command not found"
- Make sure you're in the project directory
- Try: `npx --yes vercel --prod`

### "Login required"
- Browser should open automatically
- If not, visit: https://vercel.com/login
- Then run command again

### "Directory not found"
- Make sure you ran `npm run build` first
- Check that `dist/` folder exists

## Next Steps After Deployment

1. ✅ **Generate icons** (if not done yet)
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload 512x512 PNG
   - Extract to `public/` folder
   - Rebuild: `npm run build`
   - Redeploy: `npm run deploy:vercel`

2. ✅ **Test on devices** (Android & iOS)

3. ✅ **Validate PWA:**
   - Visit: https://www.pwabuilder.com/
   - Enter your URL
   - Check score

4. ✅ **Share your PWA URL!**

---

**That's it!** Your PWA is now live. 🚀

