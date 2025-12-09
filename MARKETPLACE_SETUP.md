# Marketplace Auto-Find Setup

The marketplace system can automatically search for products on affiliate platforms. Here's how to set it up:

## eBay API Setup

To enable automatic product finding on eBay:

1. **Get eBay Developer Account**
   - Go to https://developer.ebay.com/
   - Sign up for a developer account
   - Create a new application to get your App ID

2. **Get eBay Affiliate ID** (Optional but recommended)
   - Join eBay Partner Network: https://partnernetwork.ebay.com/
   - Get your affiliate tracking ID

3. **Add to Server Environment Variables**
   
   Create or update `server/.env`:
   ```env
   EBAY_APP_ID=YourEbayAppIdHere
   EBAY_AFFILIATE_ID=YourEbayAffiliateIdHere
   ```

4. **Restart Server**
   ```bash
   cd server
   npm start
   ```

## How It Works

### Auto-Find Feature
- Click "Auto-Find Products" button when a card is selected
- System automatically searches eBay and TCGPlayer
- Shows results with prices, images, and direct links
- Click "Add" to add any result as a marketplace link

### Supported Platforms

**eBay** (Full API support)
- Automatically searches for products
- Shows prices, images, condition
- Direct product links with affiliate tracking

**TCGPlayer** (Search URL generation)
- Generates search URLs (no public API available)
- Manual product selection required
- Can be enhanced with affiliate program integration

**Other Platforms**
- Whatnot, Drip, Fanatics
- Manual URL pasting (no APIs available)

## Manual Link Addition

You can still manually paste URLs:
1. Select a card
2. Paste marketplace URL
3. System auto-detects platform
4. Click "Add Link"

## Notes

- eBay API has rate limits (check eBay documentation)
- TCGPlayer doesn't have a public API - search URLs are generated
- Affiliate IDs are automatically appended to all links
- Multiple links per platform are not allowed (one per platform per card)



