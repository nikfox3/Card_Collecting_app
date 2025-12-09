// Automatic Card Detection for Continuous Scanning
// Based on techniques from https://github.com/tranhd95/tcg-scanner
// Continuously analyzes webcam feed and detects when a card is present
// Now uses improved hybrid detection for better accuracy and speed

import { detectCardBoundaries } from './cardBoundaryDetection';
import { detectCardHybrid } from './improvedCardDetection';

/**
 * Simple card detection without OpenCV (fallback)
 * Based on tcg-scanner approach: thresholding, contouring, convex hull, rectangle approximation
 * Returns detected card corners for visual overlay
 */
const simpleCardDetection = (imageDataUrl) => {
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
      
      // Step 1: Convert to grayscale
      const grayData = new Uint8ClampedArray(width * height);
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayData[i / 4] = gray;
      }
      
      // Step 2: Apply Gaussian blur (simple 3x3 kernel)
      const blurred = new Uint8ClampedArray(width * height);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          let sum = 0;
          sum += grayData[(y - 1) * width + (x - 1)] * 1;
          sum += grayData[(y - 1) * width + x] * 2;
          sum += grayData[(y - 1) * width + (x + 1)] * 1;
          sum += grayData[y * width + (x - 1)] * 2;
          sum += grayData[y * width + x] * 4;
          sum += grayData[y * width + (x + 1)] * 2;
          sum += grayData[(y + 1) * width + (x - 1)] * 1;
          sum += grayData[(y + 1) * width + x] * 2;
          sum += grayData[(y + 1) * width + (x + 1)] * 1;
          blurred[idx] = Math.round(sum / 16);
        }
      }
      
      // Step 3: Improved edge detection with adaptive thresholds
      // Calculate image statistics for adaptive thresholding
      let sum = 0;
      let sumSq = 0;
      let pixelCount = 0;
      for (let i = 0; i < blurred.length; i++) {
        sum += blurred[i];
        sumSq += blurred[i] * blurred[i];
        pixelCount++;
      }
      const mean = sum / pixelCount;
      const variance = (sumSq / pixelCount) - (mean * mean);
      const stddev = Math.sqrt(variance);
      
      // Adaptive thresholds based on image brightness and contrast
      const adaptiveThreshold1 = Math.max(20, Math.min(80, mean * 0.3));
      const adaptiveThreshold2 = Math.max(40, Math.min(160, mean + stddev * 1.5));
      
      const edges = new Uint8ClampedArray(width * height);
      
      // Improved Sobel operator for edge detection
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const idx = y * width + x;
          
          // Sobel operator for edge detection (3x3 kernel)
          const gx = 
            -1 * blurred[(y - 1) * width + (x - 1)] +
             0 * blurred[(y - 1) * width + x] +
             1 * blurred[(y - 1) * width + (x + 1)] +
            -2 * blurred[y * width + (x - 1)] +
             0 * blurred[y * width + x] +
             2 * blurred[y * width + (x + 1)] +
            -1 * blurred[(y + 1) * width + (x - 1)] +
             0 * blurred[(y + 1) * width + x] +
             1 * blurred[(y + 1) * width + (x + 1)];
          
          const gy = 
            -1 * blurred[(y - 1) * width + (x - 1)] +
            -2 * blurred[(y - 1) * width + x] +
            -1 * blurred[(y - 1) * width + (x + 1)] +
             0 * blurred[y * width + (x - 1)] +
             0 * blurred[y * width + x] +
             0 * blurred[y * width + (x + 1)] +
             1 * blurred[(y + 1) * width + (x - 1)] +
             2 * blurred[(y + 1) * width + x] +
             1 * blurred[(y + 1) * width + (x + 1)];
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          
          // Use adaptive thresholds with hysteresis (like Canny)
          if (magnitude > adaptiveThreshold2) {
            edges[idx] = 255; // Strong edge
          } else if (magnitude > adaptiveThreshold1) {
            // Check if connected to strong edge (simplified hysteresis)
            let hasStrongNeighbor = false;
            for (let dy = -1; dy <= 1 && !hasStrongNeighbor; dy++) {
              for (let dx = -1; dx <= 1 && !hasStrongNeighbor; dx++) {
                if (dx === 0 && dy === 0) continue;
                const neighborIdx = (y + dy) * width + (x + dx);
                if (neighborIdx >= 0 && neighborIdx < edges.length) {
                  // Check if neighbor is a strong edge (we'll do this in a second pass)
                  // For now, mark as weak edge
                }
              }
            }
            edges[idx] = 128; // Weak edge (will be filtered in post-processing)
          } else {
            edges[idx] = 0;
          }
        }
      }
      
      // Post-process: Remove weak edges not connected to strong edges
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const idx = y * width + x;
          if (edges[idx] === 128) {
            // Check if connected to strong edge
            let hasStrongNeighbor = false;
            for (let dy = -1; dy <= 1 && !hasStrongNeighbor; dy++) {
              for (let dx = -1; dx <= 1 && !hasStrongNeighbor; dx++) {
                if (dx === 0 && dy === 0) continue;
                const neighborIdx = (y + dy) * width + (x + dx);
                if (neighborIdx >= 0 && neighborIdx < edges.length && edges[neighborIdx] === 255) {
                  hasStrongNeighbor = true;
                }
              }
            }
            edges[idx] = hasStrongNeighbor ? 255 : 0;
          }
        }
      }
      
      // Step 4: Find contours (simplified - find edge regions)
      // For performance, sample every 4th pixel (more samples = better detection)
      const sampleRate = 4;
      const edgePoints = [];
      for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          if (edges[y * width + x] > 0) {
            edgePoints.push([x, y]);
          }
        }
      }
      
      if (edgePoints.length < 50) {
        // Not enough edges detected
        resolve({
          success: false,
          confidence: 0,
          area: 0,
          warpedCard: imageDataUrl,
          corners: null,
          edges: null
        });
        return;
      }
      
      // Step 5: Find bounding rectangle (simplified convex hull approximation)
      let minX = width, maxX = 0, minY = height, maxY = 0;
      for (const [x, y] of edgePoints) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      
      // Step 6: Check if we have a reasonable rectangle
      const rectWidth = maxX - minX;
      const rectHeight = maxY - minY;
      const rectArea = rectWidth * rectHeight;
      const frameArea = width * height;
      const areaRatio = rectArea / frameArea;
      
      // When the bounding box covers most of the frame (areaRatio > 0.9), 
      // it means edge detection is picking up background noise, not the card.
      // In this case, we need a different strategy: look for a centered rectangular region
      // with high edge density, or use aspect ratio to find the card.
      
      // Calculate edge density within the bounding box
      const boxEdgePoints = edgePoints.filter(([x, y]) => 
        x >= minX && x <= maxX && y >= minY && y <= maxY
      );
      const boxEdgeDensity = boxEdgePoints.length / (rectArea / (sampleRate * sampleRate));
      
      // If bounding box covers >90% of frame, it's detecting the whole frame, not the card
      // In this case, try to find a card-sized region in the center
      const isWholeFrame = areaRatio > 0.9;
      
      if (isWholeFrame) {
        // Card is likely centered and takes up 30-70% of frame
        // Try to find a card-sized region in the center
        const centerX = width / 2;
        const centerY = height / 2;
        // Try multiple card size estimates - cards can vary in how much of the frame they fill
        const cardSizeEstimates = [
          { widthPercent: 0.5, heightPercent: 0.6 },  // Large card (50% width, 60% height)
          { widthPercent: 0.4, heightPercent: 0.5 },  // Medium card (40% width, 50% height)
          { widthPercent: 0.35, heightPercent: 0.45 }, // Smaller card
        ];
        
        for (const estimate of cardSizeEstimates) {
          const cardWidthEstimate = Math.min(width * estimate.widthPercent, height * estimate.heightPercent);
          const cardHeightEstimate = cardWidthEstimate / 0.714; // Card aspect ratio
          
          // Check center region for edge density
          const centerMinX = Math.max(0, centerX - cardWidthEstimate / 2);
          const centerMaxX = Math.min(width, centerX + cardWidthEstimate / 2);
          const centerMinY = Math.max(0, centerY - cardHeightEstimate / 2);
          const centerMaxY = Math.min(height, centerY + cardHeightEstimate / 2);
          
          const centerEdgePoints = edgePoints.filter(([x, y]) => 
            x >= centerMinX && x <= centerMaxX && y >= centerMinY && y <= centerMaxY
          );
          const centerArea = (centerMaxX - centerMinX) * (centerMaxY - centerMinY);
          const centerEdgeDensity = centerEdgePoints.length / (centerArea / (sampleRate * sampleRate));
          
          console.log('🎯 Center detection attempt:', {
            size: `${Math.round(cardWidthEstimate)}x${Math.round(cardHeightEstimate)}`,
            centerArea: Math.round(centerArea),
            centerEdgePoints: centerEdgePoints.length,
            centerEdgeDensity: centerEdgeDensity.toFixed(3),
            areaRatio: (centerArea / frameArea).toFixed(2)
          });
          
          // Lower threshold for center detection - cards in center should have good edge density
          if (centerEdgeDensity > 0.05 && centerArea > 30000) {
            const centerRectWidth = centerMaxX - centerMinX;
            const centerRectHeight = centerMaxY - centerMinY;
            const centerAreaRatio = centerArea / frameArea;
            
            // More lenient check for center region
            const hasCardStructure = centerAreaRatio > 0.10 && centerAreaRatio < 0.80 &&
                                     centerRectWidth > 80 && centerRectHeight > 80;
            
            if (hasCardStructure) {
              const corners = [
                [centerMinX, centerMinY],
                [centerMaxX, centerMinY],
                [centerMinX, centerMaxY],
                [centerMaxX, centerMaxY]
              ];
              
              // Calculate confidence based on center region
              const aspectRatio = centerRectWidth / centerRectHeight;
              const idealAspectRatio = 0.714;
              const aspectDiff1 = Math.abs(aspectRatio - idealAspectRatio);
              const aspectDiff2 = Math.abs(aspectRatio - (1 / idealAspectRatio));
              const minAspectDiff = Math.min(aspectDiff1, aspectDiff2);
              const aspectScore = Math.max(0, 1 - (minAspectDiff / 0.4)); // More lenient
              
              // Base confidence from edge density and area
              const edgeDensityScore = Math.min(1, centerEdgeDensity / 0.15); // Normalize to 0-1
              const areaScore = Math.max(0, 1 - Math.abs(centerAreaRatio - 0.4) / 0.4); // Ideal ~40%
              
              const confidence = 0.25 + (aspectScore * 0.3) + (edgeDensityScore * 0.25) + (areaScore * 0.2);
              
              console.log('✅ Center detection SUCCESS:', {
                confidence: confidence.toFixed(2),
                aspectRatio: aspectRatio.toFixed(2),
                edgeDensity: centerEdgeDensity.toFixed(3),
                areaRatio: centerAreaRatio.toFixed(2)
              });
              
              resolve({
                success: true,
                confidence: Math.max(0.2, Math.min(1, confidence)),
                area: centerArea,
                warpedCard: imageDataUrl,
                corners: corners,
                edges: {
                  corners: corners,
                  boundingBox: { x: centerMinX, y: centerMinY, width: centerRectWidth, height: centerRectHeight }
                }
              });
              return;
            }
          }
        }
        
        // If center detection failed, log why
        console.log('⚠️ Center detection failed - trying fallback');
      }
      
      // Normal detection for smaller bounding boxes
      const isLargeArea = areaRatio > 0.7 && areaRatio <= 0.9;
      const minEdgeDensity = isLargeArea ? 0.15 : 0.05;
      
      // Minimum size: 80x80 pixels (smaller cards can be detected)
      const hasCardStructure = !isWholeFrame && areaRatio > 0.10 && areaRatio < 0.85 && 
                               rectWidth > 80 && rectHeight > 80 &&
                               boxEdgeDensity > minEdgeDensity;
      
      // Debug logging (every call when whole frame detected, less frequent otherwise)
      const shouldLog = isWholeFrame || Math.random() < 0.1;
      if (shouldLog) {
        console.log('🔍 Simple detection debug:', {
          areaRatio: areaRatio.toFixed(2),
          rectWidth,
          rectHeight,
          rectArea,
          frameArea,
          edgePoints: edgePoints.length,
          boxEdgePoints: boxEdgePoints.length,
          boxEdgeDensity: boxEdgeDensity.toFixed(3),
          isWholeFrame,
          isLargeArea,
          minEdgeDensity,
          hasCardStructure,
          aspectRatio: (rectWidth / rectHeight).toFixed(2)
        });
      }
      
      // Step 7: Approximate corners (simplified - use bounding box corners)
      // In a real implementation, we'd use Ramer-Douglas-Peucker to find actual corners
      const corners = hasCardStructure ? [
        [minX, minY],      // top-left
        [maxX, minY],      // top-right
        [minX, maxY],      // bottom-left
        [maxX, maxY]       // bottom-right
      ] : null;
      
      // Step 8: Calculate confidence
      let confidence = 0;
      if (hasCardStructure) {
        // Confidence based on:
        // 1. Area ratio (ideal ~30%, but accept larger cards)
        // 2. Aspect ratio (cards are ~0.714:1 or 1.4:1)
        // 3. Edge density (higher = more likely to be a card)
        const aspectRatio = rectWidth / rectHeight;
        const idealAspectRatio = 0.714; // 2.5:3.5 card ratio
        
        // Check both orientations (portrait and landscape)
        const aspectDiff1 = Math.abs(aspectRatio - idealAspectRatio);
        const aspectDiff2 = Math.abs(aspectRatio - (1 / idealAspectRatio));
        const minAspectDiff = Math.min(aspectDiff1, aspectDiff2);
        
        // Normalize aspect score (more lenient)
        const aspectScore = Math.max(0, 1 - (minAspectDiff / 0.4)); // Allow up to 0.4 difference
        
        // Area score: prefer 20-50% of frame, but accept up to 80%
        let idealAreaRatio = 0.3;
        if (areaRatio > 0.7) {
          idealAreaRatio = 0.75; // Adjust ideal for large cards
        }
        const areaDiff = Math.abs(areaRatio - idealAreaRatio);
        const areaScore = Math.max(0, 1 - (areaDiff / 0.5)); // More lenient
        
        // Edge density score (higher density = more likely card)
        const edgeDensityScore = Math.min(1, boxEdgeDensity / 0.3); // Normalize to 0-1
        
        // Base confidence from structure detection
        const baseConfidence = 0.2;
        
        // Combine scores (weight edge density more for large areas)
        if (isLargeArea) {
          confidence = baseConfidence + (areaScore * 0.2) + (aspectScore * 0.2) + (edgeDensityScore * 0.4);
        } else {
          confidence = baseConfidence + (areaScore * 0.4) + (aspectScore * 0.3) + (edgeDensityScore * 0.1);
        }
        confidence = Math.max(0, Math.min(1, confidence));
      } else {
        // Even if structure check fails, give some confidence if we have reasonable area and edges
        // This helps with cards that don't perfectly match our criteria
        if (rectArea > 50000 && edgePoints.length > 100 && areaRatio > 0.05 && areaRatio < 0.9) {
          // Give low confidence but still mark as detected
          confidence = 0.15;
          // Override hasCardStructure for very large areas with good edge density
          if (areaRatio > 0.7 && boxEdgeDensity > 0.1) {
            // Force detection for large areas with good edge density
            const forcedCorners = [
              [minX, minY],
              [maxX, minY],
              [minX, maxY],
              [maxX, maxY]
            ];
            resolve({
              success: true,
              confidence: Math.max(0.2, confidence),
              area: rectArea,
              warpedCard: imageDataUrl,
              corners: forcedCorners,
              edges: {
                corners: forcedCorners,
                boundingBox: { x: minX, y: minY, width: rectWidth, height: rectHeight }
              }
            });
            return;
          }
        }
      }
      
      // Create edge visualization data (for overlay)
      const edgeVisualization = hasCardStructure ? {
        corners: corners,
        boundingBox: { x: minX, y: minY, width: rectWidth, height: rectHeight }
      } : null;
      
      resolve({
        success: hasCardStructure,
        confidence: confidence,
        area: rectArea,
        warpedCard: imageDataUrl,
        corners: corners,
        edges: edgeVisualization
      });
    };
    img.onerror = () => {
      resolve({
        success: false,
        confidence: 0,
        area: 0,
        warpedCard: imageDataUrl,
        corners: null,
        edges: null
      });
    };
    img.src = imageDataUrl;
  });
};

/**
 * Continuously detect cards in webcam feed
 * @param {HTMLVideoElement} videoElement - Video element from webcam
 * @param {Function} onCardDetected - Callback when card is detected (receives imageDataUrl)
 * @param {Object} options - Detection options
 * @returns {Function} - Function to stop detection
 */
export const startAutoDetection = (videoElement, onCardDetected, options = {}) => {
  const {
    detectionInterval = 500,        // Check every 500ms
    minConfidence = 0.7,            // Minimum confidence to trigger capture (0-1)
    minArea = 50000,                // Minimum card area in pixels
    stabilizationFrames = 3,        // Number of consecutive detections before capture
    onDetectionUpdate = null        // Callback for detection status updates
  } = options;

  let detectionIntervalId = null;
  let detectionHistory = [];
  let isProcessing = false;
  let usingSimpleDetection = false; // Track if we're using simple detection (persists across calls)

  const detectCard = async () => {
    if (isProcessing) {
      // Log when we skip due to processing (shouldn't happen often)
      if (Math.random() < 0.05) {
        console.log('⏸️ Detection skipped - already processing');
      }
      return;
    }
    
    if (!videoElement) {
      console.warn('⚠️ No video element available');
      return;
    }
    
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      // Log more frequently to debug why detection isn't running
      if (detectionHistory.length % 10 === 0) {
        console.log('⏳ Waiting for video data...', {
          readyState: videoElement.readyState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight
        });
      }
      return;
    }

    isProcessing = true;

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Try OpenCV-based detection first, fallback to simple detection
      let detectionResult;
      if (!usingSimpleDetection) {
        // Only try OpenCV if we haven't already determined it's not available
        try {
          detectionResult = await detectCardBoundaries(imageDataUrl, {
            minArea: minArea,
            cardWidth: 330,
            cardHeight: 440
          });
        } catch (error) {
          // OpenCV failed, switch to simple detection permanently
          console.log('⚠️ OpenCV not available, using simple detection');
          usingSimpleDetection = true;
          detectionResult = await simpleCardDetection(imageDataUrl);
        }
      } else {
        // Already using simple detection, skip OpenCV attempt
        detectionResult = await simpleCardDetection(imageDataUrl);
      }

      // Calculate confidence score
      let confidence = 0;
      if (detectionResult.success && detectionResult.area > 0) {
        // For simple detection, use the confidence directly from the detection result
        if (usingSimpleDetection) {
          confidence = detectionResult.confidence || 0;
          // Ensure minimum confidence if card structure is detected
          if (confidence === 0 && detectionResult.success) {
            confidence = 0.3; // Minimum confidence for detected cards
          }
        } else {
          // For OpenCV detection, calculate confidence based on:
          // 1. Detection success (40%)
          // 2. Card area relative to frame (30%)
          // 3. Card fills reasonable portion of frame (30%)
          const frameArea = canvas.width * canvas.height;
          const areaRatio = detectionResult.area / frameArea;
          const idealRatio = 0.3; // Card should be ~30% of frame
          const areaScore = 1 - Math.abs(areaRatio - idealRatio) / idealRatio;
          
          confidence = 0.4 + (detectionResult.success ? 0.3 : 0) + (areaScore * 0.3);
          confidence = Math.max(0, Math.min(1, confidence)); // Clamp 0-1
        }
      }

      // Update detection history
      detectionHistory.push({
        timestamp: Date.now(),
        confidence,
        success: detectionResult.success,
        area: detectionResult.area
      });

      // Keep only recent history (last 5 seconds)
      const fiveSecondsAgo = Date.now() - 5000;
      detectionHistory = detectionHistory.filter(d => d.timestamp > fiveSecondsAgo);

      // Check if we have stable detection
      // Lower threshold for simple detection (it's less accurate)
      // Also lower the threshold significantly since simple detection is less precise
      const effectiveMinConfidence = usingSimpleDetection ? Math.max(0.2, minConfidence * 0.4) : minConfidence;
      const recentDetections = detectionHistory.slice(-stabilizationFrames);
      const avgConfidence = recentDetections.length > 0 
        ? recentDetections.reduce((sum, d) => sum + d.confidence, 0) / recentDetections.length 
        : 0;
      // More lenient: just need success, not necessarily high confidence
      const allSuccessful = recentDetections.length >= stabilizationFrames && 
        recentDetections.every(d => d.success) && 
        avgConfidence >= effectiveMinConfidence;

      // Determine detection state: scanning → unstable → found
      let detectionState = 'scanning';
      if (detectionResult.success) {
        if (allSuccessful && recentDetections.length >= stabilizationFrames) {
          detectionState = 'found';
        } else if (recentDetections.length >= 1 && recentDetections.some(d => d.success)) {
          detectionState = 'unstable';
        }
      }
      
      // Debug logging
      if (detectionHistory.length % 5 === 0) { // Log more frequently
        if (detectionResult.success) {
          console.log('🔍 Detection:', {
            state: detectionState,
            confidence: Math.round(confidence * 100),
            area: Math.round(detectionResult.area),
            hasEdges: !!detectionResult.edges,
            corners: detectionResult.edges?.corners?.length || 0,
            videoReady: videoElement.readyState === videoElement.HAVE_ENOUGH_DATA
          });
        } else if (detectionHistory.length % 20 === 0) {
          // Log failures less frequently
          console.log('🔍 No card detected', {
            edgePoints: detectionResult.area > 0 ? 'found' : 'none',
            videoReady: videoElement.readyState === videoElement.HAVE_ENOUGH_DATA
          });
        }
      }
      
      // Scale corners/edges to match video element dimensions
      // The detection was done on canvas, but we need coordinates relative to video element
      const videoWidth = videoElement.videoWidth || canvas.width;
      const videoHeight = videoElement.videoHeight || canvas.height;
      const scaleX = videoWidth / canvas.width;
      const scaleY = videoHeight / canvas.height;
      
      let scaledEdges = null;
      if (detectionResult.edges && detectionResult.edges.corners) {
        scaledEdges = {
          ...detectionResult.edges,
          corners: detectionResult.edges.corners.map(corner => [
            corner[0] * scaleX,
            corner[1] * scaleY
          ])
        };
        
        // Debug log scaling
        if (detectionHistory.length % 10 === 0) {
          console.log('📐 Scaling edges:', {
            canvasSize: `${canvas.width}x${canvas.height}`,
            videoSize: `${videoWidth}x${videoHeight}`,
            scale: `${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`,
            originalCorner: detectionResult.edges.corners[0],
            scaledCorner: scaledEdges.corners[0]
          });
        }
      }
      
      // Report detection status
      if (onDetectionUpdate) {
        onDetectionUpdate({
          confidence,
          avgConfidence,
          detected: detectionResult.success,
          area: detectionResult.area,
          stable: allSuccessful && recentDetections.length >= stabilizationFrames,
          state: detectionState, // 'scanning' | 'unstable' | 'found'
          corners: scaledEdges?.corners || null,
          edges: scaledEdges
        });
      }

      // Auto-capture if stable detection with high confidence
      if (allSuccessful && avgConfidence >= effectiveMinConfidence && recentDetections.length >= stabilizationFrames) {
        // Use the most recent detection's warped card if available
        const bestDetection = recentDetections[recentDetections.length - 1];
        const capturedImage = detectionResult.warpedCard || imageDataUrl;
        
        // Clear history to prevent immediate re-trigger
        detectionHistory = [];
        
        // Trigger capture callback
        onCardDetected(capturedImage, {
          confidence: avgConfidence,
          detectionResult,
          corners: detectionResult.corners
        });
      }
    } catch (error) {
      console.error('Auto-detection error:', error);
      if (onDetectionUpdate) {
        onDetectionUpdate({
          confidence: 0,
          avgConfidence: 0,
          detected: false,
          error: error.message
        });
      }
    } finally {
      isProcessing = false;
    }
  };

  // Start detection loop
  console.log('🚀 Starting auto-detection', {
    interval: detectionInterval,
    minConfidence: minConfidence,
    minArea: minArea,
    stabilizationFrames: stabilizationFrames,
    videoReady: videoElement.readyState === videoElement.HAVE_ENOUGH_DATA,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight
  });
  
  // Verify interval is set correctly
  detectionIntervalId = setInterval(() => {
    // Add periodic log to confirm interval is running
    if (detectionHistory.length % 20 === 0) {
      console.log('🔄 Detection loop active', {
        historyLength: detectionHistory.length,
        isProcessing: isProcessing,
        videoReady: videoElement.readyState === videoElement.HAVE_ENOUGH_DATA
      });
    }
    detectCard();
  }, detectionInterval);
  
  // Try immediate detection
  console.log('🔍 Running initial detection...');
  detectCard();

  // Return stop function
  return () => {
    if (detectionIntervalId) {
      clearInterval(detectionIntervalId);
      detectionIntervalId = null;
    }
    detectionHistory = [];
    isProcessing = false;
  };
};

/**
 * Quick detection check (single frame)
 * Useful for manual trigger with confidence feedback
 */
export const quickDetectCard = async (videoElement) => {
  if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return { success: false, confidence: 0, error: 'Video not ready' };
  }

  try {
    // Try improved hybrid detection first (fast and accurate)
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Use hybrid detection with fast mode for quick checks
    const hybridResult = await detectCardHybrid(imageDataUrl, {
      fastMode: true,  // Use fast mode for real-time detection
      minConfidence: 0.4,
      enableOpenCV: true,
      enableSimple: true
    });
    
    if (hybridResult.success && hybridResult.confidence >= 0.4) {
      return {
        success: true,
        confidence: hybridResult.confidence,
        detected: true,
        area: hybridResult.area,
        corners: hybridResult.corners,
        method: hybridResult.method
      };
    }
    
    // Fallback to simple detection if hybrid failed
    const simpleResult = await simpleCardDetection(imageDataUrl);
    const frameArea = canvas.width * canvas.height;
    const areaRatio = simpleResult.area / frameArea;
    const idealRatio = 0.3;
    const areaScore = 1 - Math.abs(areaRatio - idealRatio) / idealRatio;
    
    const confidence = 0.3 + (simpleResult.success ? 0.2 : 0) + (areaScore * 0.3);
    
    return {
      success: simpleResult.success,
      confidence: Math.max(0, Math.min(1, confidence)),
      detected: simpleResult.success,
      area: simpleResult.area,
      warpedCard: simpleResult.warpedCard,
      corners: simpleResult.corners,
      method: 'simple-fallback'
    };
  } catch (error) {
    return { success: false, confidence: 0, error: error.message };
  }
};

