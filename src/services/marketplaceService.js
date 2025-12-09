// Marketplace Service - Fetches and caches marketplace configurations
import { API_URL } from '../utils/api';

class MarketplaceService {
  constructor() {
    this.configs = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
    this.fetchPromise = null;
  }

  async getConfigs(forceRefresh = false) {
    // Return cached configs if still valid
    if (!forceRefresh && this.configs && this.cacheTime) {
      const age = Date.now() - this.cacheTime;
      if (age < this.cacheDuration) {
        return this.configs;
      }
    }

    // If a fetch is already in progress, return that promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new configs
    this.fetchPromise = fetch(`${API_URL}/api/marketplace/config`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          this.configs = data.data;
          this.cacheTime = Date.now();
          return this.configs;
        } else {
          // Return fallback configs if API fails
          return this.getFallbackConfigs();
        }
      })
      .catch((error) => {
        console.error('Error fetching marketplace configs:', error);
        // Return fallback configs on error
        return this.getFallbackConfigs();
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }

  getFallbackConfigs() {
    // Fallback to hardcoded configs if API is unavailable
    return {
      TCGPlayer: {
        link: 'https://www.tcgplayer.com',
        logo: '/Assets/TCGplayer_Logo 1.svg',
        displayName: 'TCGPlayer',
        enabled: true,
      },
      eBay: {
        link: 'https://www.ebay.com',
        logo: null,
        displayName: 'eBay',
        enabled: true,
      },
      Whatnot: {
        link: 'https://www.whatnot.com',
        logo: null,
        displayName: 'Whatnot',
        enabled: true,
      },
      Drip: {
        link: 'https://www.drip.com',
        logo: null,
        displayName: 'Drip',
        enabled: true,
      },
      Fanatics: {
        link: 'https://www.fanaticsollect.com',
        logo: null,
        displayName: 'Fanatics',
        enabled: true,
      },
    };
  }

  async getAffiliateLink(platform, cardData = null) {
    const configs = await this.getConfigs();
    const platformConfig = configs[platform];

    if (!platformConfig || !platformConfig.enabled) {
      return null;
    }

    const affiliateId = platformConfig.affiliateId;
    let link = null;

    // First, check if there's a stored link for this product and platform
    if (cardData && cardData.productId) {
      try {
        const response = await fetch(`${API_URL}/api/marketplace/products/${cardData.productId}/links`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const storedLink = data.data.find(l => l.platform === platform);
            if (storedLink && storedLink.url) {
              link = storedLink.url;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching stored marketplace links:', error);
        // Continue to fallback behavior
      }
    }

    // If no stored link, use fallback behavior
    if (!link) {
      link = platformConfig.link;

      // For TCGPlayer, we can enhance the link with card search
      if (platform === 'TCGPlayer' && cardData) {
        const { cardName, setName } = cardData;
        
        if (cardName) {
          // Search for the card
          const searchQuery = encodeURIComponent(cardName + (setName ? ` ${setName}` : ''));
          link = `${link}/search/pokemon/product?q=${searchQuery}`;
        }
      }
      // For eBay
      else if (platform === 'eBay' && cardData) {
        const { cardName, setName } = cardData;
        
        if (cardName) {
          const searchQuery = encodeURIComponent(cardName + (setName ? ` ${setName}` : ''));
          link = `${link}/sch/i.html?_nkw=${searchQuery}`;
        }
      }
    }

    // Append affiliate ID if available
    if (affiliateId && link) {
      const separator = link.includes('?') ? '&' : '?';
      
      // Platform-specific affiliate parameters
      if (platform === 'TCGPlayer') {
        link = `${link}${separator}utm_source=affiliate&utm_medium=${affiliateId}`;
      } else if (platform === 'eBay') {
        link = `${link}${separator}mkcid=1&mkrid=711-53200-19255-0&campid=${affiliateId}`;
      } else {
        // Generic affiliate parameter for other platforms
        link = `${link}${separator}ref=${affiliateId}`;
      }
    }

    return link;
  }

  async getAllEnabledPlatforms() {
    const configs = await this.getConfigs();
    return Object.keys(configs).filter(
      (platform) => configs[platform].enabled
    );
  }

  async getPlatformLogo(platform) {
    const configs = await this.getConfigs();
    const platformConfig = configs[platform];
    
    if (platformConfig && platformConfig.logo) {
      return platformConfig.logo;
    }

    // Fallback logos
    const fallbackLogos = {
      TCGPlayer: '/Assets/TCGplayer_Logo 1.svg',
      eBay: '/Assets/EBay_logo 1.svg',
      Drip: '/Assets/Drip.svg',
      Whatnot: '/Assets/Whatnot-Logo-PNG-Pic 1.png',
      Fanatics: '/Assets/Fanatics.svg',
    };

    return fallbackLogos[platform] || null;
  }

  clearCache() {
    this.configs = null;
    this.cacheTime = null;
    this.fetchPromise = null;
  }
}

export default new MarketplaceService();


