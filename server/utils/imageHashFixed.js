// FIXED Image Hashing - Addresses critical issues:
// 1. Maintains card aspect ratio (2.5:3.5) instead of square
// 2. Proper preprocessing to match reference images
// 3. Uses ONLY dHash initially (most reliable)
// 4. Ensures hash format consistency

import sharp from 'sharp';

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
async function preprocessForHashing(imageBuffer) {
  try {
    // Ensure image buffer is valid - convert to supported format if needed
    let processedBuffer = imageBuffer;
    
    // Try to ensure it's a valid image format
    try {
      await sharp(imageBuffer).metadata();
    } catch (e) {
      // If metadata fails, try to convert/repair the image
      processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 95 })
        .toBuffer();
    }
    
    // Get image metadata
    const metadata = await sharp(processedBuffer).metadata();
    const { width, height } = metadata;
    
    // Calculate card dimensions maintaining aspect ratio
    let cardWidth, cardHeight;
    
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
    const left = Math.floor((width - cardWidth) / 2);
    const top = Math.floor((height - cardHeight) / 2);
    
    // Crop and resize maintaining aspect ratio
    const processed = await sharp(processedBuffer)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: Math.min(cardWidth, width),
        height: Math.min(cardHeight, height)
      })
      .resize(HASH_WIDTH, HASH_HEIGHT, {
        fit: 'fill', // Fill exact dimensions
        kernel: 'lanczos3' // High-quality resampling
      })
      .grayscale()
      .raw()
      .toBuffer();
    
    return processed;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return null;
  }
}

/**
 * Calculate difference hash (dHash) - MOST RELIABLE
 * This is the only hash we'll use initially for testing
 */
async function calculateDifferenceHash(imageBuffer) {
  try {
    // For dHash, we need 65x89 (65 width for difference calculation, maintain aspect ratio)
    // First resize to 65x89, then calculate differences
    
    // Ensure image buffer is valid
    let processedBuffer = imageBuffer;
    try {
      await sharp(imageBuffer).metadata();
    } catch (e) {
      processedBuffer = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
    }
    
    // Get metadata for aspect ratio handling
    const metadata = await sharp(processedBuffer).metadata();
    const { width, height } = metadata;
    
    // Calculate card dimensions maintaining aspect ratio
    let cardWidth, cardHeight;
    if (width / height > CARD_ASPECT_RATIO) {
      cardHeight = height;
      cardWidth = Math.round(height * CARD_ASPECT_RATIO);
    } else {
      cardWidth = width;
      cardHeight = Math.round(width / CARD_ASPECT_RATIO);
    }
    
    // Center crop and resize to 65x89 for dHash
    const left = Math.floor((width - cardWidth) / 2);
    const top = Math.floor((height - cardHeight) / 2);
    
    const resized = await sharp(processedBuffer)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: Math.min(cardWidth, width),
        height: Math.min(cardHeight, height)
      })
      .resize(65, HASH_HEIGHT, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .grayscale()
      .raw()
      .toBuffer();
    
    // Calculate dHash: compare adjacent pixels horizontally
    let hash = '';
    for (let y = 0; y < HASH_HEIGHT; y++) {
      for (let x = 0; x < HASH_WIDTH; x++) {
        const left = resized[y * 65 + x];
        const right = resized[y * 65 + x + 1];
        hash += left > right ? '1' : '0';
      }
    }
    
    return hash;
  } catch (error) {
    console.error('Error calculating difference hash:', error);
    return null;
  }
}

/**
 * Calculate Hamming distance between two hashes
 */
function hammingDistance(hash1, hash2) {
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
}

/**
 * Create multiple orientations of an image
 */
async function createOrientations(imageBuffer) {
  try {
    const normal = imageBuffer;
    
    // Mirrored (flip horizontally)
    const mirrored = await sharp(imageBuffer)
      .flip(true)
      .toBuffer();
    
    // Upside-down (rotate 180°)
    const upsideDown = await sharp(imageBuffer)
      .rotate(180)
      .toBuffer();
    
    // Mirrored + Upside-down
    const mirroredUpsideDown = await sharp(imageBuffer)
      .flip(true)
      .rotate(180)
      .toBuffer();
    
    return {
      normal,
      mirrored,
      upsideDown,
      mirroredUpsideDown
    };
  } catch (error) {
    console.error('Error creating orientations:', error);
    return null;
  }
}

/**
 * Calculate dHash for all orientations
 * SIMPLIFIED: Only dHash for now (most reliable)
 */
async function calculateAllHashesAllOrientations(imageBuffer) {
  const orientations = await createOrientations(imageBuffer);
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
}

export {
  calculateDifferenceHash,
  calculateAllHashesAllOrientations,
  createOrientations,
  hammingDistance,
  preprocessForHashing
};

