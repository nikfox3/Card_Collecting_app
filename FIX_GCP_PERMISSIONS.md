# Fix Google Cloud Vision API Permissions

## The Problem
You're seeing permission errors because:
1. Cloud Vision API is not enabled for your project
2. Billing is not enabled for your project  
3. The API key doesn't have proper permissions

## Quick Fix Steps

### Step 1: Enable Cloud Vision API
1. Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com
2. Select your project (or create a new one)
3. Click **"Enable"** button
4. Wait for it to enable (~30 seconds)

### Step 2: Enable Billing
1. Go to: https://console.cloud.google.com/billing
2. Click **"Link a billing account"**
3. Add a credit card (required, but free tier available)
4. Link it to your project

**Note:** Google Cloud Vision API has a **free tier**:
- First **1,000 requests/month** are FREE
- After that: $1.50 per 1,000 requests

### Step 3: Verify API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key: `AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM`
3. Click on it to edit
4. Under **"API restrictions"**, make sure:
   - Either "Don't restrict key" (for testing)
   - OR "Restrict key" → Select "Cloud Vision API"
5. Click **"Save"**

### Step 4: Test the API Key
Run this command to test:
```bash
curl -X POST \
  "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {
        "content": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      },
      "features": [{"type": "TEXT_DETECTION"}]
    }]
  }'
```

If you get a JSON response, it's working! If you get an error, continue troubleshooting.

## Alternative: Create New Project

If you can't access the current project:

1. **Create new project:**
   - Go to: https://console.cloud.google.com/projectcreate
   - Name it: "Card Scanner OCR"
   - Click "Create"

2. **Enable Cloud Vision API:**
   - Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - Select your new project
   - Click "Enable"

3. **Enable billing:**
   - Go to: https://console.cloud.google.com/billing
   - Link billing account to new project

4. **Create new API key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the new key

5. **Update .env file:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   echo 'VITE_GOOGLE_CLOUD_VISION_API_KEY=YOUR_NEW_API_KEY_HERE' > .env
   ```

6. **Restart Vite server:**
   ```bash
   # Stop Vite
   pkill -f vite
   
   # Start Vite
   npm run dev
   ```

## After Fixing

1. Restart Vite server
2. Hard refresh browser (Cmd+Shift+R)
3. Try scanning again
4. Check console - should see `hasApiKey: true` and successful OCR

## Still Having Issues?

If you can't fix the GCP permissions, we can add a Tesseract.js fallback (local OCR, no API key needed, but less accurate). Let me know!

