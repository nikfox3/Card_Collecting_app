# Google Cloud Vision API Setup Fix

## Problem
You're getting permission errors:
- `resourcemanager.projects.createBillingAssignment`
- `resourcemanager.projects.get`

This means the Google Cloud project needs proper setup.

## Solution Options

### Option 1: Enable Cloud Vision API (Recommended)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - Select the project associated with your API key

2. **Enable the API:**
   - Click "Enable" button
   - Wait for it to enable (may take a minute)

3. **Enable Billing (if required):**
   - Go to: https://console.cloud.google.com/billing
   - Link a billing account to your project
   - Note: Google Cloud Vision API has a free tier (first 1,000 requests/month free)

4. **Verify API Key Permissions:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your API key
   - Make sure "Cloud Vision API" is enabled for this key

### Option 2: Create New API Key with Proper Permissions

1. **Go to API Credentials:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"

2. **Restrict the API Key:**
   - Click on the newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Vision API"
   - Save

3. **Update .env file:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   echo 'VITE_GOOGLE_CLOUD_VISION_API_KEY=YOUR_NEW_API_KEY_HERE' > .env
   ```

### Option 3: Use API Key from Different Project

If you have access to a different GCP project:
1. Use that project's API key
2. Make sure Cloud Vision API is enabled in that project
3. Update the `.env` file with the new key

## Quick Test

After fixing permissions, test the API key:

```bash
# Test API key (replace YOUR_API_KEY with actual key)
curl -X POST \
  "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY" \
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

If successful, you'll get a JSON response. If you get an error, the API key still needs configuration.

## Alternative: Use Tesseract.js (No API Key Needed)

If you can't fix the GCP permissions, we can temporarily use Tesseract.js (local OCR) instead:

1. Modify `src/utils/improvedOCR.js` to use Tesseract as fallback
2. No API key needed
3. Less accurate but works offline

Let me know which option you'd like to pursue!

