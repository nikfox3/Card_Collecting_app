// Image Hashing utilities for visual card matching
// Based on techniques from: 
// - https://github.com/NolanAmblard/Pokemon-Card-Scanner
// - https://github.com/em4go/PokeCard-TCG-detector
//
// Uses perceptual hashing to compare card images visually instead of OCR
// This can be more accurate than text recognition for card identification

/**
 * Calculate perceptual hash (pHash) of an image
 * pHash is resistant to scaling, rotation, and minor color changes
 * Improved version with better normalization
 */
export const calculatePerceptualHash = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize to 64x64 for hash calculation (higher resolution = better accuracy)
      // Use high-quality scaling
      canvas.width = 64;
      canvas.height = 64;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, 64, 64);
      
      const imageData = ctx.getImageData(0, 0, 64, 64);
      const data = imageData.data;
      
      // Convert to grayscale with better normalization
      const grayscale = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Use luminance formula
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscale.push(gray);
      }
      
      // Calculate average
      const sum = grayscale.reduce((a, b) => a + b, 0);
      const avg = sum / grayscale.length;
      
      // Create hash: 1 if pixel > average, 0 otherwise
      let hash = '';
      for (const gray of grayscale) {
        hash += gray > avg ? '1' : '0';
      }
      
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * Calculate difference hash (dHash) of an image
 * dHash compares adjacent pixels horizontally
 * Improved with better image quality
 */
export const calculateDifferenceHash = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize to 65x64 (65 width for difference calculation, higher resolution)
      canvas.width = 65;
      canvas.height = 64;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, 65, 64);
      
      const imageData = ctx.getImageData(0, 0, 65, 64);
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
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const left = grayscale[y * 65 + x];
          const right = grayscale[y * 65 + x + 1];
          hash += left > right ? '1' : '0';
        }
      }
      
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * Calculate average hash (aHash) of an image
 * Simple but effective hash algorithm
 * Improved with better image quality
 */
export const calculateAverageHash = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize to 8x8 for hash calculation
      canvas.width = 8;
      canvas.height = 8;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, 8, 8);
      
      const imageData = ctx.getImageData(0, 0, 8, 8);
      const data = imageData.data;
      
      // Convert to grayscale and calculate average
      const grayscale = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscale.push(gray);
      }
      
      const sum = grayscale.reduce((a, b) => a + b, 0);
      const avg = sum / grayscale.length;
      
      // Create hash
      let hash = '';
      for (const gray of grayscale) {
        hash += gray > avg ? '1' : '0';
      }
      
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * Calculate Hamming distance between two hashes
 * Returns number of different bits (lower = more similar)
 */
export const hammingDistance = (hash1, hash2) => {
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
};

/**
 * Calculate wavelet hash (whash) of an image
 * Wavelet hash is good for texture matching
 * Based on discrete wavelet transform
 */
export const calculateWaveletHash = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize to 64x64 for hash calculation
      canvas.width = 64;
      canvas.height = 64;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, 64, 64);
      
      const imageData = ctx.getImageData(0, 0, 64, 64);
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
      
      // Simple wavelet-like transform: divide into 4 quadrants and compare
      // This is a simplified version - full DWT would be more complex
      const size = 64;
      const halfSize = 32;
      
      // Calculate averages for 4 quadrants
      const quadrants = [
        [], // Top-left
        [], // Top-right
        [], // Bottom-left
        []  // Bottom-right
      ];
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          const gray = grayscale[idx];
          
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
      
      // Calculate average for each quadrant
      const avgQuadrants = quadrants.map(quad => {
        const sum = quad.reduce((a, b) => a + b, 0);
        return sum / quad.length;
      });
      
      const overallAvg = avgQuadrants.reduce((a, b) => a + b, 0) / 4;
      
      // Create hash based on quadrant comparisons
      let hash = '';
      for (let i = 0; i < 4; i++) {
        hash += avgQuadrants[i] > overallAvg ? '1' : '0';
      }
      
      // Also hash the low-frequency components (simplified)
      // Compare each pixel to its quadrant average
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          const gray = grayscale[idx];
          
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
      
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * Create multiple orientations of an image
 * Returns: normal, mirrored, upside-down, mirrored+upside-down
 */
export const createOrientations = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
 * Calculate all hashes for an image (including wavelet hash)
 * Returns object with multiple hash types for better matching
 */
export const calculateAllHashes = async (imageDataUrl) => {
  const [pHash, dHash, aHash, wHash] = await Promise.all([
    calculatePerceptualHash(imageDataUrl),
    calculateDifferenceHash(imageDataUrl),
    calculateAverageHash(imageDataUrl),
    calculateWaveletHash(imageDataUrl)
  ]);
  
  return {
    perceptualHash: pHash,
    differenceHash: dHash,
    averageHash: aHash,
    waveletHash: wHash
  };
};

/**
 * Calculate all hashes for all orientations of an image
 * Returns object with hashes for each orientation
 */
export const calculateAllHashesAllOrientations = async (imageDataUrl) => {
  const orientations = await createOrientations(imageDataUrl);
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
};

/**
 * Compare image hashes and return similarity score (0-1, higher = more similar)
 */
export const compareImageHashes = (hashes1, hashes2) => {
  if (!hashes1 || !hashes2) return 0;
  
  const distances = [];
  
  if (hashes1.perceptualHash && hashes2.perceptualHash) {
    const dist = hammingDistance(hashes1.perceptualHash, hashes2.perceptualHash);
    // Normalize: 0-1 score (lower distance = higher score)
    distances.push(1 - Math.min(dist / 64, 1)); // Max distance for 64-bit hash
  }
  
  if (hashes1.differenceHash && hashes2.differenceHash) {
    const dist = hammingDistance(hashes1.differenceHash, hashes2.differenceHash);
    distances.push(1 - Math.min(dist / 1024, 1)); // Max distance for 1024-bit hash
  }
  
  if (hashes1.averageHash && hashes2.averageHash) {
    const dist = hammingDistance(hashes1.averageHash, hashes2.averageHash);
    distances.push(1 - Math.min(dist / 64, 1)); // Max distance for 64-bit hash
  }
  
  // Return average similarity score
  return distances.length > 0 
    ? distances.reduce((a, b) => a + b, 0) / distances.length 
    : 0;
};

