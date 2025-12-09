// Improved Hybrid Card Detection System
// Combines multiple detection strategies for accuracy and speed
// Strategy 1: Fast simple detection (quick check)
// Strategy 2: Enhanced OpenCV detection (accurate)
// Strategy 3: Adaptive detection (handles various conditions)

import { loadOpenCV } from './opencvLoader';

/**
 * Main detection function - tries multiple strategies for best results
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {Object} options - Detection options
 * @returns {Promise<{success: boolean, warpedCard: string|null, corners: Array|null, area: number, confidence: number, method: string}>}
 */
export const detectCardHybrid = async (imageDataUrl, options = {}) => {
  const {
    fastMode = false,           // Skip slower methods for speed
    minConfidence = 0.3,        // Minimum confidence threshold
    minArea = 5000,             // Minimum card area (pixels)
    cardWidth = 330,            // Target card width
    cardHeight = 440,           // Target card height
    enableOpenCV = true,         // Enable OpenCV-based detection
    enableSimple = true,         // Enable simple fallback detection
  } = options;

  const startTime = performance.now();
  
  try {
    // Strategy 1: Quick simple detection (fast, ~10-20ms)
    if (enableSimple) {
      const simpleResult = await detectCardSimple(imageDataUrl, { minArea, minConfidence });
      if (simpleResult.success && simpleResult.confidence >= minConfidence) {
        const elapsed = performance.now() - startTime;
        console.log(`✅ Simple detection succeeded in ${elapsed.toFixed(1)}ms (confidence: ${simpleResult.confidence.toFixed(2)})`);
        return { ...simpleResult, method: 'simple', detectionTime: elapsed };
      }
    }

    // Strategy 2: Enhanced OpenCV detection (accurate, ~50-150ms)
    if (enableOpenCV && !fastMode) {
      try {
        const opencvResult = await detectCardOpenCV(imageDataUrl, { 
          minArea, 
          cardWidth, 
          cardHeight,
          adaptive: true // Use adaptive thresholds
        });
        
        if (opencvResult.success && opencvResult.confidence >= minConfidence) {
          const elapsed = performance.now() - startTime;
          console.log(`✅ OpenCV detection succeeded in ${elapsed.toFixed(1)}ms (confidence: ${opencvResult.confidence.toFixed(2)})`);
          return { ...opencvResult, method: 'opencv', detectionTime: elapsed };
        }
      } catch (error) {
        console.warn('⚠️ OpenCV detection failed, falling back:', error.message);
      }
    }

    // Strategy 3: Adaptive detection (handles difficult cases, ~100-200ms)
    if (!fastMode) {
      const adaptiveResult = await detectCardAdaptive(imageDataUrl, { minArea, cardWidth, cardHeight });
      if (adaptiveResult.success && adaptiveResult.confidence >= minConfidence) {
        const elapsed = performance.now() - startTime;
        console.log(`✅ Adaptive detection succeeded in ${elapsed.toFixed(1)}ms (confidence: ${adaptiveResult.confidence.toFixed(2)})`);
        return { ...adaptiveResult, method: 'adaptive', detectionTime: elapsed };
      }
    }

    // No detection succeeded
    const elapsed = performance.now() - startTime;
    console.log(`⚠️ No card detected after ${elapsed.toFixed(1)}ms`);
    
    // Return original image with low confidence
    return {
      success: false,
      warpedCard: imageDataUrl,
      corners: null,
      area: 0,
      confidence: 0,
      method: 'none',
      detectionTime: elapsed
    };

  } catch (error) {
    console.error('❌ Detection error:', error);
    return {
      success: false,
      warpedCard: imageDataUrl,
      corners: null,
      area: 0,
      confidence: 0,
      method: 'error',
      error: error.message
    };
  }
};

/**
 * Fast simple detection (no OpenCV required)
 * Uses basic image processing for quick checks
 */
async function detectCardSimple(imageDataUrl, options = {}) {
  const { minArea = 5000, minConfidence = 0.3 } = options;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Quick edge detection using Sobel operator (simplified)
      const edgeMap = detectEdgesSimple(data, width, height);
      
      // Find largest rectangular region
      const cardRegion = findCardRegionSimple(edgeMap, width, height, minArea);
      
      if (cardRegion && cardRegion.confidence >= minConfidence) {
        // Crop and return card
        const { x, y, w, h } = cardRegion;
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = w;
        croppedCanvas.height = h;
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCtx.drawImage(img, x, y, w, h, 0, 0, w, h);
        
        resolve({
          success: true,
          warpedCard: croppedCanvas.toDataURL('image/jpeg', 0.95),
          corners: [
            [x, y],
            [x + w, y],
            [x, y + h],
            [x + w, y + h]
          ],
          area: w * h,
          confidence: cardRegion.confidence
        });
      } else {
        resolve({
          success: false,
          warpedCard: imageDataUrl,
          corners: null,
          area: 0,
          confidence: cardRegion?.confidence || 0
        });
      }
    };
    img.onerror = () => resolve({ success: false, warpedCard: imageDataUrl, corners: null, area: 0, confidence: 0 });
    img.src = imageDataUrl;
  });
}

/**
 * Enhanced OpenCV detection with adaptive preprocessing
 */
async function detectCardOpenCV(imageDataUrl, options = {}) {
  const {
    minArea = 5000,
    cardWidth = 330,
    cardHeight = 440,
    adaptive = true
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const cv = await loadOpenCV();
      
      const img = new Image();
      img.onload = () => {
        try {
          const src = cv.imread(img);
          
          // Step 1: Convert to grayscale
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          
          // Step 2: Adaptive preprocessing based on image quality
          let processed = gray;
          
          if (adaptive) {
            // Calculate image statistics for adaptive thresholds
            const mean = cv.mean(gray);
            const stddev = new cv.Mat();
            cv.meanStdDev(gray, new cv.Mat(), stddev);
            const stddevValue = stddev.data64F[0];
            
            // If image is too dark or low contrast, enhance it
            if (mean[0] < 100 || stddevValue < 30) {
              // Apply histogram equalization for better contrast
              const equalized = new cv.Mat();
              cv.equalizeHist(gray, equalized);
              processed = equalized;
              equalized.delete();
            } else {
              // Apply Gaussian blur for noise reduction
              const blurred = new cv.Mat();
              cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
              processed = blurred;
            }
          } else {
            // Standard Gaussian blur
            const blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
            processed = blurred;
          }
          
          // Step 3: Adaptive Canny edge detection
          const edges = new cv.Mat();
          if (adaptive) {
            // Use Otsu's method for automatic threshold selection
            const threshold = new cv.Mat();
            cv.threshold(processed, threshold, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            const otsuValue = cv.mean(threshold)[0];
            threshold.delete();
            
            // Use Otsu value to set Canny thresholds
            const cannyLow = Math.max(50, otsuValue * 0.5);
            const cannyHigh = Math.min(200, otsuValue * 2);
            cv.Canny(processed, edges, cannyLow, cannyHigh);
          } else {
            cv.Canny(processed, edges, 100, 200);
          }
          
          // Step 4: Morphological operations (improved)
          const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
          const dilated = new cv.Mat();
          cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 2);
          const cleaned = new cv.Mat();
          cv.erode(dilated, cleaned, kernel, new cv.Point(-1, -1), 1);
          
          // Step 5: Find contours
          const contours = new cv.MatVector();
          const hierarchy = new cv.Mat();
          cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          
          // Step 6: Find best card contour with aspect ratio validation
          let bestContour = null;
          let maxScore = 0;
          const cardAspectRatio = cardWidth / cardHeight; // ~0.75
          const aspectRatioTolerance = 0.2; // Allow 20% variation
          
          for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area < minArea) continue;
            
            // Approximate contour to polygon
            const peri = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * peri, true);
            
            // Check if it's roughly rectangular (4 corners)
            if (approx.rows >= 4 && approx.rows <= 6) {
              // Get bounding rectangle
              const rect = cv.boundingRect(approx);
              const rectAspectRatio = rect.width / rect.height;
              
              // Calculate score based on area and aspect ratio match
              const aspectScore = 1 - Math.abs(rectAspectRatio - cardAspectRatio) / cardAspectRatio;
              const areaScore = Math.min(1, area / (img.width * img.height * 0.5)); // Prefer cards that are 10-50% of image
              const score = areaScore * 0.6 + aspectScore * 0.4;
              
              if (score > maxScore && aspectScore > (1 - aspectRatioTolerance)) {
                maxScore = score;
                bestContour = approx;
              } else {
                approx.delete();
              }
            } else {
              approx.delete();
            }
          }
          
          // Step 7: Extract and transform card
          if (bestContour && bestContour.rows >= 4) {
            // Extract corner points
            const corners = [];
            for (let i = 0; i < Math.min(bestContour.rows, 4); i++) {
              const point = bestContour.intPtr(i, 0);
              corners.push([point[0], point[1]]);
            }
            
            // Ensure we have 4 corners
            if (corners.length === 4) {
              const reorderedCorners = reorderCorners(corners);
              
              // Apply perspective transformation
              const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                reorderedCorners[0][0], reorderedCorners[0][1],
                reorderedCorners[1][0], reorderedCorners[1][1],
                reorderedCorners[2][0], reorderedCorners[2][1],
                reorderedCorners[3][0], reorderedCorners[3][1]
              ]);
              
              const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0, 0,
                cardWidth, 0,
                0, cardHeight,
                cardWidth, cardHeight
              ]);
              
              const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
              const warped = new cv.Mat();
              cv.warpPerspective(src, warped, M, new cv.Size(cardWidth, cardHeight));
              
              // Convert to data URL
              const canvas = document.createElement('canvas');
              cv.imshow(canvas, warped);
              const warpedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
              
              // Calculate confidence based on score
              const confidence = Math.min(1, maxScore);
              
              // Clean up
              cleanupMats([src, gray, processed, edges, dilated, cleaned, contours, hierarchy, kernel, bestContour, srcPoints, dstPoints, M, warped]);
              
              resolve({
                success: true,
                warpedCard: warpedDataUrl,
                corners: reorderedCorners,
                area: cv.contourArea(bestContour),
                confidence: confidence
              });
              return;
            }
          }
          
          // Clean up if no card found
          cleanupMats([src, gray, processed, edges, dilated, cleaned, contours, hierarchy, kernel]);
          if (bestContour) bestContour.delete();
          
          resolve({
            success: false,
            warpedCard: imageDataUrl,
            corners: null,
            area: 0,
            confidence: maxScore
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Adaptive detection - tries multiple strategies based on image conditions
 */
async function detectCardAdaptive(imageDataUrl, options = {}) {
  // Try OpenCV with different preprocessing strategies
  const strategies = [
    { adaptive: true, cannyLow: 50, cannyHigh: 150 },
    { adaptive: false, cannyLow: 100, cannyHigh: 200 },
    { adaptive: true, cannyLow: 30, cannyHigh: 100 }, // More sensitive
  ];
  
  for (const strategy of strategies) {
    try {
      const result = await detectCardOpenCV(imageDataUrl, { ...options, ...strategy });
      if (result.success && result.confidence >= 0.4) {
        return result;
      }
    } catch (error) {
      console.warn('Adaptive strategy failed:', error.message);
    }
  }
  
  return { success: false, warpedCard: imageDataUrl, corners: null, area: 0, confidence: 0 };
}

/**
 * Simple edge detection using Sobel operator
 */
function detectEdgesSimple(data, width, height) {
  const edges = new Uint8Array(width * height);
  
  // Convert to grayscale and detect edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Grayscale
      const r = data[(idx * 4)];
      const g = data[(idx * 4) + 1];
      const b = data[(idx * 4) + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      // Sobel operator (simplified)
      const gx = 
        -1 * getGray(data, width, x - 1, y - 1) +
         1 * getGray(data, width, x + 1, y - 1) +
        -2 * getGray(data, width, x - 1, y) +
         2 * getGray(data, width, x + 1, y) +
        -1 * getGray(data, width, x - 1, y + 1) +
         1 * getGray(data, width, x + 1, y + 1);
      
      const gy = 
        -1 * getGray(data, width, x - 1, y - 1) +
        -2 * getGray(data, width, x, y - 1) +
        -1 * getGray(data, width, x + 1, y - 1) +
         1 * getGray(data, width, x - 1, y + 1) +
         2 * getGray(data, width, x, y + 1) +
         1 * getGray(data, width, x + 1, y + 1);
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = magnitude > 50 ? 255 : 0;
    }
  }
  
  return edges;
}

function getGray(data, width, x, y) {
  const idx = y * width + x;
  const r = data[(idx * 4)];
  const g = data[(idx * 4) + 1];
  const b = data[(idx * 4) + 2];
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Find card region from edge map
 */
function findCardRegionSimple(edgeMap, width, height, minArea) {
  // Find bounding box of edge regions
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let edgeCount = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edgeMap[y * width + x] > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        edgeCount++;
      }
    }
  }
  
  if (edgeCount < 100) return null;
  
  const w = maxX - minX;
  const h = maxY - minY;
  const area = w * h;
  
  if (area < minArea) return null;
  
  // Check aspect ratio (card is roughly 2.5:3.5 or 5:7)
  const aspectRatio = w / h;
  const cardAspectRatio = 5 / 7; // ~0.714
  const aspectScore = 1 - Math.abs(aspectRatio - cardAspectRatio) / cardAspectRatio;
  
  // Check if region is reasonable size (10-70% of image)
  const imageArea = width * height;
  const areaRatio = area / imageArea;
  const areaScore = areaRatio >= 0.1 && areaRatio <= 0.7 ? 1 : 0.5;
  
  const confidence = aspectScore * 0.6 + areaScore * 0.4;
  
  return {
    x: Math.max(0, minX - 5),
    y: Math.max(0, minY - 5),
    w: Math.min(width, w + 10),
    h: Math.min(height, h + 10),
    confidence: confidence
  };
}

/**
 * Reorder corners to [topLeft, topRight, bottomLeft, bottomRight]
 */
function reorderCorners(corners) {
  if (!corners || corners.length !== 4) return corners;
  
  const centerX = corners.reduce((sum, c) => sum + c[0], 0) / 4;
  const centerY = corners.reduce((sum, c) => sum + c[1], 0) / 4;
  
  const topLeft = corners.filter(c => c[0] < centerX && c[1] < centerY)[0] || corners[0];
  const topRight = corners.filter(c => c[0] >= centerX && c[1] < centerY)[0] || corners[1];
  const bottomLeft = corners.filter(c => c[0] < centerX && c[1] >= centerY)[0] || corners[2];
  const bottomRight = corners.filter(c => c[0] >= centerX && c[1] >= centerY)[0] || corners[3];
  
  return [topLeft, topRight, bottomLeft, bottomRight];
}

/**
 * Clean up OpenCV Mat objects
 */
function cleanupMats(mats) {
  mats.forEach(mat => {
    if (mat && mat.delete) mat.delete();
  });
}

