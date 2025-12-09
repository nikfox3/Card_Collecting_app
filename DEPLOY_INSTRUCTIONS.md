# Deploy Instructions - Step by Step

## Current Status
✅ Build is working
❌ Need to login to Vercel

## Steps to Deploy

### Step 1: Login to Vercel

Run this command from the **project root**:
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run vercel:login
```

**What happens:**
1. Browser will open (or you'll get a URL)
2. Sign in with GitHub/Email
3. Authorize Vercel
4. Terminal will show "Success! Authentication complete."

### Step 2: Deploy

After logging in successfully, run:
```bash
npm run deploy:vercel
```

This will:
1. Build your app
2. Deploy to Vercel
3. Give you a URL like `https://cardstax.vercel.app`

## Quick Commands

```bash
# Make sure you're in the right directory
cd /Users/NikFox/Documents/git/Card_Collecting_app

# Login (first time only)
npm run vercel:login

# Deploy
npm run deploy:vercel
```

## Troubleshooting

### "Missing script" error
- Make sure you're in `/Users/NikFox/Documents/git/Card_Collecting_app`
- NOT in `server/` or `admin-dashboard/` directories

### "Token not valid" error
- Run `npm run vercel:login` again
- Complete the browser login process

### Browser doesn't open
- Copy the URL from terminal
- Paste in browser manually
- Complete login

## After Deployment

Once deployed, you'll get a URL. Then:
1. Open URL on your phone
2. Android: Chrome → "Add to Home Screen"
3. iOS: Safari → Share → "Add to Home Screen"

Your PWA will be live! 🚀

