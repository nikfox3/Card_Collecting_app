// FIXED Client-side Image Hashing
// Addresses critical issues:
// 1. Maintains card aspect ratio (2.5:3.5) instead of square
// 2. Proper preprocessing to match reference images
// 3. Uses ONLY dHash initially (most reliable)
// 4. Ensures hash format consistency

// Card aspect ratio: 2.5:3.5 (or 5:7)
const CARD_ASPECT_RATIO = 2.5 / 3.5; // ~0.714
const HASH_WIDTH = 64;
// Use Math.floor to get 89 (not 90) to match database hashes
// Math.round(64 / 0.714) = 90, but database hashes are 64x89 = 5696 bits
const HASH_HEIGHT = Math.floor(HASH_WIDTH / CARD_ASPECT_RATIO); // 89

/**
 * Preprocess image to match reference image format
 * - Proper cropping (card only, no background)
 * - Maintain aspect ratio
 * - Same resize method as reference images
 */
function preprocessForHashing(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const { width, height } = img;
      
      // DEBUG: Log image dimensions
      console.log('🔍 Preprocessing image for hashing:', {
        originalWidth: width,
        originalHeight: height,
        aspectRatio: (width / height).toFixed(3),
        cardAspectRatio: CARD_ASPECT_RATIO.toFixed(3)
      });
      
      // If the image is already close to card aspect ratio, use it directly
      // Otherwise, crop to card aspect ratio
      const imageAspectRatio = width / height;
      const aspectRatioDiff = Math.abs(imageAspectRatio - CARD_ASPECT_RATIO);
      
      let cardWidth, cardHeight, left, top;
      
      // If aspect ratio is very close (within 5%), use full image
      // This means card extraction likely succeeded and we have a clean card image
      if (aspectRatioDiff < 0.05) {
        console.log('✅ Image aspect ratio matches card, using full image (card extraction likely succeeded)');
        cardWidth = width;
        cardHeight = height;
        left = 0;
        top = 0;
      } else {
        // Image doesn't match card aspect ratio - might be full camera frame
        // Try to crop to card aspect ratio, but warn if the image is too different
        console.warn('⚠️ Image aspect ratio does NOT match card:', {
          imageRatio: imageAspectRatio.toFixed(3),
          cardRatio: CARD_ASPECT_RATIO.toFixed(3),
          difference: aspectRatioDiff.toFixed(3),
          possibleIssue: 'Card extraction may have failed - using full camera frame'
        });
        
        // Calculate card dimensions maintaining aspect ratio
        if (width / height > CARD_ASPECT_RATIO) {
          // Image is wider than card ratio - fit height, crop width
          cardHeight = height;
          cardWidth = Math.round(height * CARD_ASPECT_RATIO);
        } else {
          // Image is taller than card ratio - fit width, crop height
          cardWidth = width;
          cardHeight = Math.round(width / CARD_ASPECT_RATIO);
        }
        
        // Center crop to get just the card (remove background)
        // WARNING: If card extraction failed, this might crop the wrong area!
        left = Math.floor((width - cardWidth) / 2);
        top = Math.floor((height - cardHeight) / 2);
        
        console.log('✂️ Cropping image (may crop wrong area if card extraction failed):', {
          cardWidth,
          cardHeight,
          left,
          top,
          cropWidth: cardWidth,
          cropHeight: cardHeight,
          warning: 'If card is not centered, this will hash the wrong part of the image!'
        });
      }
      
      // Set canvas to hash dimensions
      canvas.width = HASH_WIDTH;
      canvas.height = HASH_HEIGHT;
      
      // Draw cropped and resized image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        left, top, cardWidth, cardHeight, // Source (cropped)
        0, 0, HASH_WIDTH, HASH_HEIGHT    // Destination (resized)
      );
      
      // DEBUG: Log hash dimensions
      console.log('✅ Preprocessed image ready for hashing:', {
        hashWidth: HASH_WIDTH,
        hashHeight: HASH_HEIGHT,
        expectedHashLength: HASH_WIDTH * HASH_HEIGHT,
        finalAspectRatio: (HASH_WIDTH / HASH_HEIGHT).toFixed(3),
        note: 'Should be 64x89 = 5696 bits (FIXED - was 64x90 = 5760)'
      });
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => {
      console.error('❌ Failed to load image for preprocessing');
      resolve(null);
    };
    img.src = imageDataUrl;
  });
}

/**
 * Calculate difference hash (dHash) - MOST RELIABLE
 * This is the only hash we'll use initially for testing
 */
export const calculateDifferenceHash = async (imageDataUrl) => {
  return new Promise(async (resolve) => {
    // Preprocess first (maintain aspect ratio, proper cropping)
    const preprocessed = await preprocessForHashing(imageDataUrl);
    if (!preprocessed) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // For dHash, we need 65x89 (65 width for difference calculation, maintain aspect ratio)
      canvas.width = 65;
      canvas.height = HASH_HEIGHT;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, 65, HASH_HEIGHT);
      
      const imageData = ctx.getImageData(0, 0, 65, HASH_HEIGHT);
      const data = imageData.data;
      
      // Convert to grayscale
      const grayscale = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscale.push(gray);
      }
      
      // Calculate differences between adjacent pixels
      let hash = '';
      let hashBits = 0;
      for (let y = 0; y < HASH_HEIGHT; y++) {
        for (let x = 0; x < HASH_WIDTH; x++) {
          const left = grayscale[y * 65 + x];
          const right = grayscale[y * 65 + x + 1];
          hash += left > right ? '1' : '0';
          hashBits++;
        }
      }
      
      // DEBUG: Log hash info
      const hashPreview = hash.substring(0, 50) + '...' + hash.substring(hash.length - 50);
      const onesCount = (hash.match(/1/g) || []).length;
      const zerosCount = (hash.match(/0/g) || []).length;
      console.log('🔐 Calculated dHash:', {
        hashLength: hash.length,
        expectedLength: HASH_WIDTH * HASH_HEIGHT,
        hashBits,
        onesCount,
        zerosCount,
        hashPreview,
        first10: hash.substring(0, 10),
        last10: hash.substring(hash.length - 10)
      });
      
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = preprocessed;
  });
};

/**
 * Calculate Hamming distance between two hashes
 */
export const hammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2) {
    return Infinity;
  }
  
  // Handle different lengths (shouldn't happen, but be safe)
  const minLength = Math.min(hash1.length, hash2.length);
  let distance = Math.abs(hash1.length - hash2.length); // Penalty for length mismatch
  
  for (let i = 0; i < minLength; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
};

/**
 * Create multiple orientations of an image
 */
export const createOrientations = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Normal orientation
      ctx.drawImage(img, 0, 0);
      const normal = canvas.toDataURL('image/jpeg', 0.95);
      
      // Mirrored (flip horizontally)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const mirrored = canvas.toDataURL('image/jpeg', 0.95);
      
      // Upside-down (rotate 180°)
      ctx.save();
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const upsideDown = canvas.toDataURL('image/jpeg', 0.95);
      
      // Mirrored + Upside-down
      ctx.save();
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const mirroredUpsideDown = canvas.toDataURL('image/jpeg', 0.95);
      
      resolve({
        normal,
        mirrored,
        upsideDown,
        mirroredUpsideDown
      });
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * Calculate dHash for all orientations
 * SIMPLIFIED: Only dHash for now (most reliable)
 */
export const calculateAllHashesAllOrientations = async (imageDataUrl) => {
  const orientations = await createOrientations(imageDataUrl);
  if (!orientations) {
    return null;
  }
  
  const [normal, mirrored, upsideDown, mirroredUpsideDown] = await Promise.all([
    calculateDifferenceHash(orientations.normal),
    calculateDifferenceHash(orientations.mirrored),
    calculateDifferenceHash(orientations.upsideDown),
    calculateDifferenceHash(orientations.mirroredUpsideDown)
  ]);
  
  return {
    normal: { differenceHash: normal },
    mirrored: { differenceHash: mirrored },
    upsideDown: { differenceHash: upsideDown },
    mirroredUpsideDown: { differenceHash: mirroredUpsideDown }
  };
};

