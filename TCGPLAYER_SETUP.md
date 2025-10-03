# TCGPlayer API Setup Guide

This guide will help you set up TCGPlayer API access for real-time Pokemon card pricing.

## Step 1: Create TCGPlayer Developer Account

1. Go to [TCGPlayer Developer Portal](https://docs.tcgplayer.com/)
2. Sign up for a developer account
3. Navigate to your application settings

## Step 2: Get API Credentials

TCGPlayer uses OAuth 2.0 Client Credentials flow for server-to-server authentication. You'll need:

- **Client ID** (API Key)
- **Client Secret**

### For Client Credentials Flow:
1. In your TCGPlayer developer dashboard, create a new application
2. Select "Server-to-Server" application type
3. Note down your **Client ID** and **Client Secret**

## Step 3: Set Environment Variables

Create a `.env` file in your project root with:

```bash
REACT_APP_TCGPLAYER_API_KEY=your_client_id_here
REACT_APP_TCGPLAYER_CLIENT_SECRET=your_client_secret_here
```

## Step 4: Test the Integration

Run the price update service to test TCGPlayer integration:

```bash
node -e "
import PriceUpdateService from './src/services/priceUpdateService.js';
PriceUpdateService.updateAllPrices().then(results => {
  console.log('Update results:', results);
}).catch(console.error);
"
```

## API Endpoints Used

Our integration uses these TCGPlayer API endpoints:

1. **Authentication**: `POST https://api.tcgplayer.com/token`
   - Uses Client Credentials flow
   - Returns access token for API calls

2. **Product Search**: `GET https://api.tcgplayer.com/catalog/products`
   - Search for Pokemon cards by name and set
   - Returns product IDs and details

3. **Pricing Data**: `GET https://api.tcgplayer.com/pricing/product/{productIds}`
   - Get current market prices for specific products
   - Returns market price, low price, high price, etc.

## Rate Limits

TCGPlayer has rate limits:
- **Authentication**: 10 requests per minute
- **API Calls**: 1000 requests per hour per application

Our service includes:
- Automatic token refresh
- Batch processing with delays
- Error handling and retry logic

## Fallback System

If TCGPlayer API is not available or configured:
- The system automatically falls back to historical data trends
- Prices are updated based on existing historical patterns
- No data loss or service interruption

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check your Client ID and Client Secret
2. **403 Forbidden**: Verify your application has the correct permissions
3. **429 Too Many Requests**: Rate limit exceeded, service will retry automatically

### Debug Mode:

Enable debug logging by setting:
```bash
DEBUG=tcgplayer
```

## Next Steps

Once TCGPlayer API is configured:

1. **Daily Price Collection**: Set up a cron job to run daily price updates
2. **Real-time Updates**: Integrate price updates into your app's UI
3. **Monitoring**: Set up alerts for API failures or rate limit issues

## Support

- [TCGPlayer API Documentation](https://docs.tcgplayer.com/)
- [TCGPlayer Support](https://support.tcgplayer.com/)
