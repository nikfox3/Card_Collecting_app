// Marketplace Product Finder Service
// Automatically searches for products on affiliate platforms

import axios from 'axios';

class MarketplaceProductFinder {
  constructor() {
    this.ebayAppId = process.env.EBAY_APP_ID || null;
    this.ebayAffiliateId = process.env.EBAY_AFFILIATE_ID || null;
  }

  /**
   * Search for products on eBay using the Finding API
   */
  async searchEbay(cardName, setName = null, options = {}) {
    if (!this.ebayAppId) {
      throw new Error('eBay App ID not configured. Set EBAY_APP_ID environment variable.');
    }

    try {
      // Build search query
      let query = cardName;
      if (setName) {
        query += ` ${setName}`;
      }
      query += ' pokemon card';

      // eBay Finding API endpoint
      const url = 'https://svcs.ebay.com/services/search/FindingService/v1';
      const params = {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': this.ebayAppId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': query,
        'paginationInput.entriesPerPage': options.limit || 10,
        'sortOrder': 'PricePlusShippingLowest', // Sort by price
        'itemFilter(0).name': 'ListingType',
        'itemFilter(0).value': 'FixedPrice', // Only fixed price listings
        'itemFilter(1).name': 'Condition',
        'itemFilter(1).value': 'New', // Only new items
      };

      // Add affiliate tracking if available
      if (this.ebayAffiliateId) {
        params['affiliate.networkId'] = '9';
        params['affiliate.trackingId'] = this.ebayAffiliateId;
      }

      const response = await axios.get(url, { params });

      if (response.data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item) {
        const items = response.data.findItemsByKeywordsResponse[0].searchResult[0].item;
        
        return items.map(item => ({
          platform: 'eBay',
          productId: item.itemId?.[0],
          title: item.title?.[0],
          url: item.viewItemURL?.[0],
          price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__,
          currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'],
          imageUrl: item.galleryURL?.[0],
          shippingCost: item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__,
          condition: item.condition?.[0]?.conditionDisplayName?.[0],
          listingType: item.listingInfo?.[0]?.listingType?.[0],
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching eBay:', error);
      throw new Error(`Failed to search eBay: ${error.message}`);
    }
  }

  /**
   * Search for products on TCGPlayer
   * Note: TCGPlayer doesn't have a public API, so we construct search URLs
   * and could potentially scrape or use their affiliate program
   */
  async searchTCGPlayer(cardName, setName = null, options = {}) {
    try {
      // Build search query
      let query = cardName;
      if (setName) {
        query += ` ${setName}`;
      }

      // TCGPlayer search URL structure
      const searchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(query)}`;
      
      // Since TCGPlayer doesn't have a public API, we return search URLs
      // In the future, this could be enhanced with:
      // 1. Web scraping (with permission/ToS compliance)
      // 2. TCGPlayer affiliate program integration
      // 3. Partner API access if available
      
      return [{
        platform: 'TCGPlayer',
        productId: null,
        title: `Search results for: ${query}`,
        url: searchUrl,
        price: null,
        imageUrl: null,
        note: 'TCGPlayer search URL - manual product selection required',
      }];
    } catch (error) {
      console.error('Error searching TCGPlayer:', error);
      throw new Error(`Failed to search TCGPlayer: ${error.message}`);
    }
  }

  /**
   * Search all configured platforms for a product
   */
  async searchAll(cardName, setName = null, platforms = ['eBay', 'TCGPlayer'], options = {}) {
    const results = {};

    for (const platform of platforms) {
      try {
        if (platform === 'eBay') {
          results.eBay = await this.searchEbay(cardName, setName, options);
        } else if (platform === 'TCGPlayer') {
          results.TCGPlayer = await this.searchTCGPlayer(cardName, setName, options);
        }
        // Add other platforms as needed
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
        results[platform] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Get product details from a marketplace URL
   */
  async getProductFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      if (hostname.includes('ebay.com') || hostname.includes('ebay.ca')) {
        const itemId = url.match(/\/itm\/(\d+)/)?.[1];
        if (itemId && this.ebayAppId) {
          // Use eBay Shopping API to get item details
          const shoppingUrl = 'https://open.api.ebay.com/shopping';
          const params = {
            'callname': 'GetSingleItem',
            'responseencoding': 'JSON',
            'appid': this.ebayAppId,
            'siteid': '0',
            'version': '967',
            'ItemID': itemId,
            'IncludeSelector': 'Details,ItemSpecifics,Variations,ShippingCosts',
          };

          const response = await axios.get(shoppingUrl, { params });
          
          if (response.data.Item) {
            const item = response.data.Item;
            return {
              platform: 'eBay',
              productId: item.ItemID,
              title: item.Title,
              url: item.ViewItemURLForNaturalSearch,
              price: item.ConvertedCurrentPrice?.Value,
              currency: item.ConvertedCurrentPrice?.CurrencyID,
              imageUrl: item.PictureURL?.[0],
              description: item.Description,
              condition: item.ConditionDisplayName,
            };
          }
        }
      }

      // For other platforms, return basic info from URL
      return {
        url,
        platform: this.detectPlatform(url),
      };
    } catch (error) {
      console.error('Error getting product from URL:', error);
      throw error;
    }
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('tcgplayer.com')) return 'TCGPlayer';
    if (hostname.includes('ebay.com') || hostname.includes('ebay.ca')) return 'eBay';
    if (hostname.includes('whatnot.com')) return 'Whatnot';
    if (hostname.includes('drip.com')) return 'Drip';
    if (hostname.includes('fanatics.com') || hostname.includes('fanaticsollect.com')) return 'Fanatics';
    
    return 'Unknown';
  }
}

export default new MarketplaceProductFinder();



