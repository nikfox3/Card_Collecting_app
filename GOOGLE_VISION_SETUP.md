# Google Cloud Vision API Setup

## Step 1: Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Cloud Vision API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

## Step 2: Add to Environment

Add to your `.env` file (create it if it doesn't exist):

```bash
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

## Step 3: Restart Dev Server

After adding the API key, restart your Vite dev server:

```bash
npm run dev
```

## Step 4: Test

Scan a card - you should see in the console:
```
🔍 Using Google Cloud Vision API for OCR...
✅ Google Vision OCR completed
```

## Cost

- **Free tier:** 1,000 requests/month
- **After free tier:** $1.50 per 1,000 requests
- **Example:** 10,000 scans/month = ~$13.50/month

## Security Note

The API key is exposed in the frontend (Vite environment variable). For production:
1. Use API key restrictions in Google Cloud Console
2. Restrict to your domain only
3. Consider using a backend proxy instead

