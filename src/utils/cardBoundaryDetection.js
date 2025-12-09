// Card Boundary Detection using OpenCV.js
// Based on techniques from NolanAmblard/Pokemon-Card-Scanner
// Detects card edges, finds corners, and applies perspective correction
// Now uses improved hybrid detection system for better accuracy and speed

import { detectCardHybrid } from './improvedCardDetection';
import { loadOpenCV } from './opencvLoader';

/**
 * Detect card boundaries and extract card using perspective transformation
 * Uses improved hybrid detection system (fast + accurate)
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {Object} options - Options for detection
 * @returns {Promise<{success: boolean, warpedCard: string|null, corners: Array|null, area: number, confidence: number, method: string}>}
 */
export const detectCardBoundaries = async (imageDataUrl, options = {}) => {
  // Use improved hybrid detection by default
  // Falls back to original OpenCV method if needed
  try {
    const result = await detectCardHybrid(imageDataUrl, {
      fastMode: options.fastMode || false,
      minConfidence: options.minConfidence || 0.3,
      ...options
    });
    
    // If hybrid detection succeeded, return it
    if (result.success) {
      return result;
    }
    
    // Fallback to original OpenCV detection
    return await detectCardBoundariesOriginal(imageDataUrl, options);
  } catch (error) {
    console.warn('Hybrid detection failed, using fallback:', error.message);
    return await detectCardBoundariesOriginal(imageDataUrl, options);
  }
};

/**
 * Original OpenCV detection (kept as fallback)
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {Object} options - Options for detection
 * @returns {Promise<{success: boolean, warpedCard: string|null, corners: Array|null, area: number}>}
 */
const detectCardBoundariesOriginal = async (imageDataUrl, options = {}) => {
  const {
    minArea = 5000,           // Minimum contour area (pixels)
    cardWidth = 330,          // Target card width
    cardHeight = 440,         // Target card height
    cannyThreshold1 = 100,    // Canny edge detection threshold 1
    cannyThreshold2 = 200,    // Canny edge detection threshold 2
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const cv = await loadOpenCV();
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // Create OpenCV Mat from image
          const src = cv.imread(img);
          
          // Step 1: Convert to grayscale
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          
          // Step 1.5: Calculate adaptive thresholds based on image statistics
          const mean = new cv.Mat();
          const stddev = new cv.Mat();
          cv.meanStdDev(gray, mean, stddev);
          const meanVal = mean.data64F[0];
          const stddevVal = stddev.data64F[0];
          mean.delete();
          stddev.delete();
          
          // Adaptive Canny thresholds based on image brightness and contrast
          // Lower thresholds for darker images, higher for brighter
          const adaptiveThreshold1 = Math.max(30, Math.min(150, meanVal * 0.5));
          const adaptiveThreshold2 = Math.max(60, Math.min(300, meanVal + stddevVal * 2));
          
          // Step 2: Apply adaptive histogram equalization for better contrast
          const clahe = new cv.Mat();
          const claheObj = new cv.CLAHE(2.0, new cv.Size(8, 8));
          claheObj.apply(gray, clahe);
          claheObj.delete();
          
          // Step 3: Apply Gaussian blur to reduce noise (slightly larger kernel for better smoothing)
          const blurred = new cv.Mat();
          cv.GaussianBlur(clahe, blurred, new cv.Size(5, 5), 0);
          
          // Step 4: Canny edge detection with adaptive thresholds
          const edges = new cv.Mat();
          cv.Canny(blurred, edges, adaptiveThreshold1, adaptiveThreshold2);
          
          // Clean up CLAHE mat
          clahe.delete();
          
          // Step 5: Morphological operations to clean up edges
          // Use larger kernel for better edge connection
          const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
          const dilated = new cv.Mat();
          cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 2);
          const cleaned = new cv.Mat();
          cv.erode(dilated, cleaned, kernel, new cv.Point(-1, -1), 1);
          
          // Step 6: Find contours
          const contours = new cv.MatVector();
          const hierarchy = new cv.Mat();
          cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          
          // Step 7: Find best rectangular contour with improved scoring
          let bestContour = null;
          let bestScore = 0;
          const frameArea = src.rows * src.cols;
          
          for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > minArea) {
              // Approximate contour to polygon with adaptive epsilon
              const peri = cv.arcLength(contour, true);
              // Use adaptive epsilon: tighter for larger contours
              const epsilon = Math.max(0.01 * peri, 0.02 * peri);
              const approx = new cv.Mat();
              cv.approxPolyDP(contour, approx, epsilon, true);
              
              // Calculate score based on multiple factors
              let score = 0;
              
              // Factor 1: Area (prefer larger cards, but not too large)
              const areaRatio = area / frameArea;
              const idealAreaRatio = 0.3; // Cards typically take ~30% of frame
              const areaScore = 1 - Math.abs(areaRatio - idealAreaRatio) / idealAreaRatio;
              
              // Factor 2: Rectangle shape (4 corners)
              const isRectangular = approx.rows === 4;
              const shapeScore = isRectangular ? 1 : 0;
              
              // Factor 3: Convexity (cards are convex shapes)
              const hull = new cv.Mat();
              cv.convexHull(contour, hull);
              const hullArea = cv.contourArea(hull);
              const convexityScore = hullArea > 0 ? area / hullArea : 0;
              hull.delete();
              
              // Factor 4: Aspect ratio (cards are ~0.714:1 or 1.4:1)
              if (isRectangular) {
                const rect = cv.boundingRect(contour);
                const aspectRatio = rect.width / rect.height;
                const idealAspectRatio = 0.714; // 2.5:3.5 card ratio
                const aspectDiff1 = Math.abs(aspectRatio - idealAspectRatio);
                const aspectDiff2 = Math.abs(aspectRatio - (1 / idealAspectRatio));
                const minAspectDiff = Math.min(aspectDiff1, aspectDiff2);
                const aspectScore = Math.max(0, 1 - (minAspectDiff / 0.3)); // Allow up to 0.3 difference
                
                // Combined score (weighted)
                score = (areaScore * 0.3) + (shapeScore * 0.3) + (convexityScore * 0.2) + (aspectScore * 0.2);
              } else {
                // Still consider non-rectangular contours but with lower weight
                score = (areaScore * 0.4) + (convexityScore * 0.3);
              }
              
              // Prefer 4-corner rectangles, but accept 3-5 corners if score is high
              if (score > bestScore && (approx.rows >= 3 && approx.rows <= 5)) {
                bestScore = score;
                bestContour = approx.clone();
              } else {
                approx.delete();
              }
            }
          }
          
          // Step 8: If we found a good contour, extract and transform
          if (bestContour && bestContour.rows >= 3) {
            // Extract corner points
            let corners = [];
            for (let i = 0; i < bestContour.rows; i++) {
              const point = bestContour.intPtr(i, 0);
              corners.push([point[0], point[1]]);
            }
            
            // If we have more than 4 corners, try to reduce to 4 using convex hull
            if (corners.length > 4) {
              // Use bounding box corners as approximation
              const rect = cv.boundingRect(bestContour);
              corners = [
                [rect.x, rect.y],                           // top-left
                [rect.x + rect.width, rect.y],              // top-right
                [rect.x, rect.y + rect.height],             // bottom-left
                [rect.x + rect.width, rect.y + rect.height] // bottom-right
              ];
            } else if (corners.length === 3) {
              // If we have 3 corners, estimate the 4th corner
              // Calculate bounding box and use its corners
              const rect = cv.boundingRect(bestContour);
              corners = [
                [rect.x, rect.y],
                [rect.x + rect.width, rect.y],
                [rect.x, rect.y + rect.height],
                [rect.x + rect.width, rect.y + rect.height]
              ];
            }
            
            // Reorder corners to [topLeft, topRight, bottomLeft, bottomRight]
            const reorderedCorners = reorderCorners(corners);
            
            // Calculate final area before cleanup
            const finalArea = cv.contourArea(bestContour);
            
            // Step 8: Apply perspective transformation
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
            
            // Clean up
            src.delete();
            gray.delete();
            blurred.delete();
            edges.delete();
            dilated.delete();
            cleaned.delete();
            contours.delete();
            hierarchy.delete();
            kernel.delete();
            bestContour.delete();
            srcPoints.delete();
            dstPoints.delete();
            M.delete();
            warped.delete();
            
            resolve({
              success: true,
              warpedCard: warpedDataUrl,
              corners: reorderedCorners,
              area: finalArea,
              confidence: bestScore,
              edges: {
                corners: reorderedCorners,
                boundingBox: {
                  x: Math.min(...reorderedCorners.map(c => c[0])),
                  y: Math.min(...reorderedCorners.map(c => c[1])),
                  width: Math.max(...reorderedCorners.map(c => c[0])) - Math.min(...reorderedCorners.map(c => c[0])),
                  height: Math.max(...reorderedCorners.map(c => c[1])) - Math.min(...reorderedCorners.map(c => c[1]))
                }
              }
            });
          } else {
            // No card found, return original image
            const canvas = document.createElement('canvas');
            cv.imshow(canvas, src);
            const originalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            // Clean up
            src.delete();
            gray.delete();
            blurred.delete();
            edges.delete();
            dilated.delete();
            cleaned.delete();
            contours.delete();
            hierarchy.delete();
            kernel.delete();
            
            resolve({
              success: false,
              warpedCard: originalDataUrl, // Return original if detection fails
              corners: null,
              area: 0,
              edges: null,
              confidence: 0
            });
          }
        } catch (error) {
          reject(new Error(`Card boundary detection failed: ${error.message}`));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    } catch (error) {
      reject(new Error(`OpenCV initialization failed: ${error.message}`));
    }
  });
};

/**
 * Reorder corners to [topLeft, topRight, bottomLeft, bottomRight]
 * Based on the algorithm from NolanAmblard/Pokemon-Card-Scanner
 */
function reorderCorners(corners) {
  if (!corners || corners.length !== 4) {
    return corners; // Return as-is if invalid
  }
  
  // Calculate center point
  const centerX = corners.reduce((sum, c) => sum + c[0], 0) / 4;
  const centerY = corners.reduce((sum, c) => sum + c[1], 0) / 4;
  
  // Categorize corners by position relative to center
  const categorized = {
    topLeft: corners.filter(c => c[0] < centerX && c[1] < centerY),
    topRight: corners.filter(c => c[0] >= centerX && c[1] < centerY),
    bottomLeft: corners.filter(c => c[0] < centerX && c[1] >= centerY),
    bottomRight: corners.filter(c => c[0] >= centerX && c[1] >= centerY)
  };
  
  // Get closest corner to each quadrant (or use first available)
  const topLeft = categorized.topLeft.length > 0 
    ? categorized.topLeft.reduce((closest, c) => {
        const distClosest = Math.sqrt(Math.pow(closest[0] - 0, 2) + Math.pow(closest[1] - 0, 2));
        const distC = Math.sqrt(Math.pow(c[0] - 0, 2) + Math.pow(c[1] - 0, 2));
        return distC < distClosest ? c : closest;
      })
    : corners[0];
  
  const topRight = categorized.topRight.length > 0
    ? categorized.topRight.reduce((closest, c) => {
        const distClosest = Math.sqrt(Math.pow(closest[0] - 1000, 2) + Math.pow(closest[1] - 0, 2));
        const distC = Math.sqrt(Math.pow(c[0] - 1000, 2) + Math.pow(c[1] - 0, 2));
        return distC < distClosest ? c : closest;
      })
    : corners[1];
  
  const bottomLeft = categorized.bottomLeft.length > 0
    ? categorized.bottomLeft.reduce((closest, c) => {
        const distClosest = Math.sqrt(Math.pow(closest[0] - 0, 2) + Math.pow(closest[1] - 1000, 2));
        const distC = Math.sqrt(Math.pow(c[0] - 0, 2) + Math.pow(c[1] - 1000, 2));
        return distC < distClosest ? c : closest;
      })
    : corners[2];
  
  const bottomRight = categorized.bottomRight.length > 0
    ? categorized.bottomRight.reduce((closest, c) => {
        const distClosest = Math.sqrt(Math.pow(closest[0] - 1000, 2) + Math.pow(closest[1] - 1000, 2));
        const distC = Math.sqrt(Math.pow(c[0] - 1000, 2) + Math.pow(c[1] - 1000, 2));
        return distC < distClosest ? c : closest;
      })
    : corners[3];
  
  return [topLeft, topRight, bottomLeft, bottomRight];
}

