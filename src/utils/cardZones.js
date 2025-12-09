// Card Zone Extraction - Extract text from specific regions of Pokemon cards
// Pokemon cards have a consistent layout:
// - Top-left/top-center: Card name
// - Top-right: HP
// - Middle: Attacks (with damage in parentheses)
// - Bottom-right: Card number (e.g., "25/165")

/**
 * Extract a specific zone from a card image
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {object} zone - Zone definition {x, y, width, height} as percentages (0-1)
 * @returns {Promise<string>} Base64 data URL of the cropped zone
 */
export const extractZone = (imageDataUrl, zone) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate pixel coordinates from percentages
      const x = Math.floor(zone.x * img.width);
      const y = Math.floor(zone.y * img.height);
      const width = Math.floor(zone.width * img.width);
      const height = Math.floor(zone.height * img.height);
      
      // Set canvas size to zone size
      canvas.width = width;
      canvas.height = height;
      
      // Draw the zone region
      ctx.drawImage(
        img,
        x, y, width, height,  // Source rectangle
        0, 0, width, height   // Destination rectangle
      );
      
      // Convert to data URL
      const zoneImage = canvas.toDataURL('image/jpeg', 0.95);
      resolve(zoneImage);
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

/**
 * Standard Pokemon card zones (as percentages of card dimensions)
 * Based on typical Pokemon card layout
 */
export const CARD_ZONES = {
  // Card name zone - top-left to top-center (usually largest text at top)
  NAME: {
    x: 0.05,      // Start 5% from left
    y: 0.02,      // Start 2% from top
    width: 0.70,  // 70% of width (leaves room for HP on right)
    height: 0.12  // 12% of height (top section)
  },
  
  // HP zone - top-right corner
  HP: {
    x: 0.75,      // Start 75% from left
    y: 0.02,      // Start 2% from top
    width: 0.20,  // 20% of width
    height: 0.10  // 10% of height
  },
  
  // Card number zone - bottom-right corner
  NUMBER: {
    x: 0.75,      // Start 75% from left
    y: 0.88,      // Start 88% from top (near bottom)
    width: 0.20,  // 20% of width
    height: 0.10  // 10% of height
  },
  
  // Attack zone - middle section (where attacks are)
  ATTACK: {
    x: 0.10,      // Start 10% from left
    y: 0.50,      // Start 50% from top (middle)
    width: 0.80,  // 80% of width
    height: 0.35  // 35% of height (middle section)
  },
  
  // Full top section (for fallback name extraction)
  TOP_SECTION: {
    x: 0.05,
    y: 0.02,
    width: 0.90,
    height: 0.15
  }
};

/**
 * Extract all zones from a card image
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<object>} Object with zone images
 */
export const extractAllZones = async (imageDataUrl) => {
  const zones = {};
  
  for (const [zoneName, zoneDef] of Object.entries(CARD_ZONES)) {
    try {
      zones[zoneName] = await extractZone(imageDataUrl, zoneDef);
    } catch (error) {
      console.warn(`Failed to extract zone ${zoneName}:`, error);
      zones[zoneName] = null;
    }
  }
  
  return zones;
};

