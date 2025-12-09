// Server-side image hashing utilities
// Used to pre-compute and store hashes for cards in the database

import sharp from 'sharp';

/**
 * Calculate perceptual hash from image buffer
 */
async function calculatePerceptualHash(imageBuffer) {
  try {
    // Resize to 64x64 and convert to grayscale (higher resolution = better accuracy)
    const resized = await sharp(imageBuffer)
      .resize(64, 64)
      .grayscale()
      .raw()
      .toBuffer();
    
    // Calculate average
    let sum = 0;
    for (let i = 0; i < resized.length; i++) {
      sum += resized[i];
    }
    const avg = sum / resized.length;
    
    // Create hash
    let hash = '';
    for (let i = 0; i < resized.length; i++) {
      hash += resized[i] > avg ? '1' : '0';
    }
    
    return hash;
  } catch (error) {
    console.error('Error calculating perceptual hash:', error);
    return null;
  }
}

/**
 * Calculate difference hash from image buffer
 */
async function calculateDifferenceHash(imageBuffer) {
  try {
    // Resize to 65x64 for difference calculation (higher resolution)
    const resized = await sharp(imageBuffer)
      .resize(65, 64)
      .grayscale()
      .raw()
      .toBuffer();
    
    let hash = '';
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
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
 * Calculate average hash from image buffer
 */
async function calculateAverageHash(imageBuffer) {
  try {
    // Resize to 8x8
    const resized = await sharp(imageBuffer)
      .resize(8, 8)
      .grayscale()
      .raw()
      .toBuffer();
    
    // Calculate average
    let sum = 0;
    for (let i = 0; i < resized.length; i++) {
      sum += resized[i];
    }
    const avg = sum / resized.length;
    
    // Create hash
    let hash = '';
    for (let i = 0; i < resized.length; i++) {
      hash += resized[i] > avg ? '1' : '0';
    }
    
    return hash;
  } catch (error) {
    console.error('Error calculating average hash:', error);
    return null;
  }
}

/**
 * Calculate Hamming distance between two hashes
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return Infinity;
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Calculate wavelet hash from image buffer
 * Simplified wavelet-like transform for texture matching
 */
async function calculateWaveletHash(imageBuffer) {
  try {
    // Resize to 64x64
    const resized = await sharp(imageBuffer)
      .resize(64, 64)
      .grayscale()
      .raw()
      .toBuffer();
    
    const size = 64;
    const halfSize = 32;
    
    // Calculate averages for 4 quadrants
    const quadrants = [[], [], [], []];
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const gray = resized[idx];
        
        if (y < halfSize && x < halfSize) {
          quadrants[0].push(gray);
        } else if (y < halfSize && x >= halfSize) {
          quadrants[1].push(gray);
        } else if (y >= halfSize && x < halfSize) {
          quadrants[2].push(gray);
        } else {
          quadrants[3].push(gray);
        }
      }
    }
    
    const avgQuadrants = quadrants.map(quad => {
      const sum = quad.reduce((a, b) => a + b, 0);
      return sum / quad.length;
    });
    
    const overallAvg = avgQuadrants.reduce((a, b) => a + b, 0) / 4;
    
    // Create hash
    let hash = '';
    for (let i = 0; i < 4; i++) {
      hash += avgQuadrants[i] > overallAvg ? '1' : '0';
    }
    
    // Hash low-frequency components
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const gray = resized[idx];
        
        let quadrantAvg;
        if (y < halfSize && x < halfSize) {
          quadrantAvg = avgQuadrants[0];
        } else if (y < halfSize && x >= halfSize) {
          quadrantAvg = avgQuadrants[1];
        } else if (y >= halfSize && x < halfSize) {
          quadrantAvg = avgQuadrants[2];
        } else {
          quadrantAvg = avgQuadrants[3];
        }
        
        hash += gray > quadrantAvg ? '1' : '0';
      }
    }
    
    return hash;
  } catch (error) {
    console.error('Error calculating wavelet hash:', error);
    return null;
  }
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
 * Calculate all hashes for an image (including wavelet hash)
 */
async function calculateAllHashes(imageBuffer) {
  const [pHash, dHash, aHash, wHash] = await Promise.all([
    calculatePerceptualHash(imageBuffer),
    calculateDifferenceHash(imageBuffer),
    calculateAverageHash(imageBuffer),
    calculateWaveletHash(imageBuffer)
  ]);
  
  return {
    perceptualHash: pHash,
    differenceHash: dHash,
    averageHash: aHash,
    waveletHash: wHash
  };
}

/**
 * Calculate all hashes for all orientations of an image
 */
async function calculateAllHashesAllOrientations(imageBuffer) {
  const orientations = await createOrientations(imageBuffer);
  if (!orientations) {
    return null;
  }
  
  const [normal, mirrored, upsideDown, mirroredUpsideDown] = await Promise.all([
    calculateAllHashes(orientations.normal),
    calculateAllHashes(orientations.mirrored),
    calculateAllHashes(orientations.upsideDown),
    calculateAllHashes(orientations.mirroredUpsideDown)
  ]);
  
  return {
    normal,
    mirrored,
    upsideDown,
    mirroredUpsideDown
  };
}

export {
  calculatePerceptualHash,
  calculateDifferenceHash,
  calculateAverageHash,
  calculateWaveletHash,
  calculateAllHashes,
  calculateAllHashesAllOrientations,
  createOrientations,
  hammingDistance
};

