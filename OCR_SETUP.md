# 🔍 OCR Setup Guide - Improving Card Scanner Accuracy

The card scanner now supports multiple OCR providers for better accuracy. Here's how to set them up:

## 📋 Available OCR Providers

### 1. **Google Cloud Vision API** (Recommended - Most Accurate)
- **Accuracy**: ~95%+ for card text
- **Cost**: Free tier: 1,000 requests/month, then $1.50 per 1,000 requests
- **Speed**: Fast (~500ms per request)
- **Setup**: Requires API key

### 2. **Tesseract.js** (Default - Free)
- **Accuracy**: ~60-70% for card text
- **Cost**: Free (runs locally)
- **Speed**: Slower (~2-5 seconds)
- **Setup**: Already included, no setup needed

## 🚀 Quick Setup: Google Cloud Vision API

### Step 1: Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Cloud Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### Step 2: Configure in Your App

Add the API key to your `.env` file in the root directory:

```bash
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

**Important**: 
- The `VITE_` prefix is required for Vite to expose it to the frontend
- Never commit your API key to git
- Add `.env` to `.gitignore` if not already there

### Step 3: Restart Your Dev Server

```bash
npm run dev
```

The scanner will automatically use Google Vision API if the key is configured, otherwise it falls back to Tesseract.

## 🎯 How It Works

The scanner uses a **smart fallback system**:

1. **First**: Tries Google Cloud Vision API (if configured)
2. **Fallback**: Uses Tesseract.js if Google Vision fails or isn't configured
3. **Multiple Strategies**: Tries different image preprocessing with Tesseract

## 💰 Cost Estimation

For Google Cloud Vision API:
- **Free Tier**: 1,000 requests/month
- **After Free Tier**: $1.50 per 1,000 requests
- **Example**: 10,000 scans/month = ~$13.50/month

**Tip**: The free tier is usually enough for personal use and testing!

## 🔒 Security Best Practices

1. **Restrict API Key** (Recommended):
   - In Google Cloud Console, edit your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Vision API" only
   - Under "Application restrictions", add your domain (for production)

2. **Environment Variables**:
   - Never commit `.env` files
   - Use different keys for development/production
   - Rotate keys periodically

## 🧪 Testing

After setup, scan a card and check the browser console. You should see:
```
🔍 Available providers: Google Vision=true, Tesseract=true
🔍 Trying Google Cloud Vision API...
✅ Google Vision result: { textLength: 45, confidence: 0.95 }
```

## 🐛 Troubleshooting

### "Google Cloud Vision API key not configured"
- Make sure `.env` file exists in root directory
- Check that variable name starts with `VITE_`
- Restart dev server after adding key

### "Google Vision API error: API key not valid"
- Verify API key is correct
- Check that Cloud Vision API is enabled
- Ensure API key restrictions allow your domain

### Still getting poor results?
- Try better lighting when scanning
- Hold card steady and fill the frame
- Use "Search Manually" as fallback
- Check that image preprocessing is working

## 📚 Alternative Options

If Google Vision doesn't work for you, consider:

1. **AWS Textract** - Similar accuracy, different pricing
2. **Azure Computer Vision** - Microsoft's OCR service
3. **Improve Tesseract** - Better image preprocessing, custom training

## 🎨 Current Features

The scanner now uses:
- ✅ **Multi-provider OCR** (Google Vision + Tesseract)
- ✅ **Color analysis** (detects energy type)
- ✅ **HP extraction** (from OCR text)
- ✅ **Attack damage extraction** (from OCR text)
- ✅ **Smart search** (combines all attributes)

All of these work together to improve accuracy!

