# Quick Deploy Commands

## ⚠️ Important: Run from Project Root

Make sure you're in the **root directory** of the project:
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
```

## Deploy Commands

### Deploy to Vercel
```bash
npm run deploy:vercel
```

### Deploy to Netlify
```bash
npm run deploy:netlify
```

### Login to Vercel (first time only)
```bash
npm run vercel:login
```

### Build Only
```bash
npm run build
```

## Quick Check

**Verify you're in the right directory:**
```bash
pwd
# Should show: /Users/NikFox/Documents/git/Card_Collecting_app
```

**Check available scripts:**
```bash
npm run
# Should show deploy:vercel in the list
```

## Common Mistake

❌ **Wrong:** Running from `server/` directory
```bash
cd server
npm run deploy:vercel  # ❌ Won't work
```

✅ **Correct:** Running from project root
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run deploy:vercel  # ✅ Works!
```

