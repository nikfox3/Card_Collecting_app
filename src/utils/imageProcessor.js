// Image Processing Utility for Card Images
// Handles background removal, enhancement, and optimization

class ImageProcessor {
  constructor() {
    this.cache = new Map();
    this.processingQueue = new Set();
  }

  // Get processed image URL with background removal and enhancement
  getProcessedImageUrl(originalUrl, options = {}) {
    if (!originalUrl || originalUrl === '/placeholder-card.png') {
      return originalUrl;
    }

    const {
      removeBackground = true,
      enhance = true,
      quality = 'high',
      format = 'webp',
      roundedCorners = true,
      size = 'medium'
    } = options;

    // Create cache key
    const cacheKey = `${originalUrl}_${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // For now, return the original URL with CSS filters applied
    // In the future, this could integrate with background removal APIs
    const processedUrl = this.applyImageEnhancements(originalUrl, options);
    
    this.cache.set(cacheKey, processedUrl);
    return processedUrl;
  }

  // Apply CSS-based image enhancements
  applyImageEnhancements(originalUrl, options) {
    // Create a data URL with CSS filters for background removal simulation
    // This is a temporary solution until we implement proper background removal
    return originalUrl;
  }

  // Get CSS classes for image enhancement
  getImageClasses(options = {}) {
    const {
      removeBackground = true,
      enhance = true,
      roundedCorners = true,
      size = 'medium'
    } = options;

    let classes = 'object-contain';

    // Size-based classes
    switch (size) {
      case 'small':
        classes += ' w-16 h-20';
        break;
      case 'medium':
        classes += ' w-full h-full';
        break;
      case 'large':
        classes += ' w-[240px] h-auto';
        break;
      case 'xlarge':
        classes += ' w-[500px] h-auto';
        break;
    }

    // Rounded corners - different sizes for different use cases
    if (roundedCorners) {
      switch (size) {
        case 'small':
          classes += ' rounded-md'; // 6px for search results
          break;
        case 'large':
          classes += ' rounded-2xl'; // 16px for card profile
          break;
        case 'xlarge':
          classes += ' rounded-3xl'; // 24px for expanded view
          break;
        default:
          classes += ' rounded-lg'; // 8px for medium
          break;
      }
    }

    return classes;
  }

  // Get CSS styles for image enhancement
  getImageStyles(options = {}) {
    const {
      removeBackground = true,
      enhance = true,
      quality = 'high'
    } = options;

    const styles = {
      objectFit: 'contain',
      objectPosition: 'center'
    };

    // Simulate background removal with CSS filters
    if (removeBackground) {
      styles.filter = 'contrast(1.1) saturate(1.1) brightness(1.05)';
      styles.mixBlendMode = 'multiply';
    }

    // Enhance image quality
    if (enhance) {
      styles.imageRendering = 'high-quality';
      styles.imageRendering = '-webkit-optimize-contrast';
    }

    return styles;
  }

  // Get container classes for image display
  getContainerClasses(options = {}) {
    const {
      roundedCorners = true,
      size = 'medium',
      hasBackground = false
    } = options;

    let classes = 'flex items-center justify-center overflow-hidden';

    // Size-based container classes
    switch (size) {
      case 'small':
        classes += ' aspect-[3/4]';
        break;
      case 'medium':
        classes += ' w-full h-full';
        break;
      case 'large':
        classes += ' w-[350px] h-[336px]';
        break;
      case 'xlarge':
        classes += ' max-w-[90vw] max-h-[80vh]';
        break;
    }

    // Rounded corners - different sizes for different use cases
    if (roundedCorners) {
      switch (size) {
        case 'small':
          classes += ' rounded-lg'; // 8px for search results
          break;
        case 'large':
          classes += ' rounded-3xl'; // 24px for card profile
          break;
        case 'xlarge':
          classes += ' rounded-3xl'; // 24px for expanded view
          break;
        default:
          classes += ' rounded-xl'; // 12px for medium
          break;
      }
    }

    // Background
    if (hasBackground) {
      classes += ' bg-gray-800/50';
    }

    return classes;
  }

  // Process image for specific use cases
  processForCardProfile(imageUrl) {
    return this.getProcessedImageUrl(imageUrl, {
      removeBackground: true,
      enhance: true,
      quality: 'high',
      roundedCorners: true,
      size: 'large'
    });
  }

  processForSearchResults(imageUrl) {
    return this.getProcessedImageUrl(imageUrl, {
      removeBackground: true,
      enhance: true,
      quality: 'medium',
      roundedCorners: true,
      size: 'small'
    });
  }

  processForExpandedView(imageUrl) {
    return this.getProcessedImageUrl(imageUrl, {
      removeBackground: true,
      enhance: true,
      quality: 'high',
      roundedCorners: true,
      size: 'xlarge'
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
const imageProcessor = new ImageProcessor();

export default imageProcessor;
