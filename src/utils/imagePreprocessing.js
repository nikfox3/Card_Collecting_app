// Image preprocessing utilities for better card recognition accuracy
// Based on techniques used by successful card scanning apps

/**
 * Normalize brightness and contrast of an image
 * This helps match cards scanned under different lighting conditions
 */
export const normalizeBrightnessContrast = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate mean and standard deviation for normalization
      let sum = 0;
      let sumSq = 0;
      const pixelCount = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale for statistics
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += gray;
        sumSq += gray * gray;
      }
      
      const mean = sum / pixelCount;
      const variance = (sumSq / pixelCount) - (mean * mean);
      const stdDev = Math.sqrt(variance);
      
      // Target values for normalization
      const targetMean = 128;
      const targetStdDev = 50;
      
      // Normalize each pixel
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Normalize
        const normalized = ((gray - mean) / stdDev) * targetStdDev + targetMean;
        
        // Apply to RGB channels proportionally
        const ratio = normalized / gray;
        data[i] = Math.max(0, Math.min(255, data[i] * ratio));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * ratio)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * ratio)); // B
        // Alpha channel stays the same
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(imageDataUrl); // Return original on error
    img.src = imageDataUrl;
  });
};

/**
 * Sharpen image edges for better feature detection
 */
export const sharpenImage = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Sharpen kernel (unsharp mask)
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      
      // Create a copy for reading
      const originalData = new Uint8ClampedArray(data);
      
      // Apply kernel
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB channels
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                const kernelIdx = (ky + 1) * 3 + (kx + 1);
                sum += originalData[idx] * kernel[kernelIdx];
              }
            }
            const idx = (y * width + x) * 4 + c;
            data[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
};

/**
 * Reduce noise in image
 */
export const denoiseImage = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Simple median filter (3x3)
      const originalData = new Uint8ClampedArray(data);
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            const values = [];
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                values.push(originalData[idx]);
              }
            }
            // Sort and take median
            values.sort((a, b) => a - b);
            const median = values[4]; // Middle value (9 values, index 4)
            const idx = (y * width + x) * 4 + c;
            data[idx] = median;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
};

/**
 * Apply all preprocessing steps for optimal matching
 */
export const preprocessImage = async (imageDataUrl, options = {}) => {
  const {
    normalize = true,
    sharpen = true,
    denoise = false, // Denoise is slower, use sparingly
  } = options;
  
  let processed = imageDataUrl;
  
  try {
    // Step 1: Normalize brightness/contrast (most important)
    if (normalize) {
      processed = await normalizeBrightnessContrast(processed);
    }
    
    // Step 2: Denoise (if enabled)
    if (denoise) {
      processed = await denoiseImage(processed);
    }
    
    // Step 3: Sharpen edges
    if (sharpen) {
      processed = await sharpenImage(processed);
    }
    
    return processed;
  } catch (error) {
    console.warn('⚠️ Preprocessing error, using original image:', error);
    return imageDataUrl; // Return original on error
  }
};

