# Fix: Google Vision API Key Not Loading

## Problem
The console shows: `hasApiKey: false, envKeys: Array(0)` - Vite isn't loading the `.env` file.

## Solution

### Step 1: Verify .env file exists
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
cat .env
```

Should show:
```
VITE_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM
```

### Step 2: If .env doesn't exist or is wrong, create it:
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
echo 'VITE_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM' > .env
```

### Step 3: Stop Vite server
Press `Ctrl+C` in the terminal where Vite is running, OR:
```bash
pkill -f vite
```

### Step 4: Restart Vite server
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run dev
```

### Step 5: Hard refresh browser
- **Mac**: `Cmd+Shift+R`
- **Windows/Linux**: `Ctrl+Shift+R`

### Step 6: Verify in console
After refreshing, you should see:
```
🔍 Starting OCR (Google Vision only)... {
  provider: 'Google Cloud Vision API',
  hasApiKey: true,  ← Should be TRUE
  apiKeyLength: 39,
  apiKeyPreview: 'AIzaSyCAsI...',
  envKeys: ['VITE_GOOGLE_CLOUD_VISION_API_KEY']  ← Should show the key
}
```

## Common Issues

### Issue: Still shows `hasApiKey: false`
**Solution**: 
1. Make sure `.env` is in the **root directory** (same folder as `package.json`)
2. Make sure variable name starts with `VITE_`
3. Restart Vite server completely (kill and restart)
4. Clear browser cache and hard refresh

### Issue: `.env` file is ignored
**Solution**: Check `.gitignore` - `.env` should be listed (this is correct for security)

### Issue: Vite server won't restart
**Solution**: 
```bash
# Kill all Vite processes
pkill -9 -f vite

# Wait 2 seconds
sleep 2

# Start fresh
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run dev
```

## Quick Test
After restarting, open browser console and type:
```javascript
import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY
```

Should return: `"AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM"`

If it returns `undefined`, the environment variable isn't loaded - restart Vite again.

