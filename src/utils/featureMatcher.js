// Feature-based card matching using OpenCV.js
// Uses ORB (Oriented FAST and Rotated BRIEF) feature detection
// More robust than hashing - handles rotation, scale, and lighting changes

import { loadOpenCV } from './opencvLoader';

/**
 * Detect ORB features in an image
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<{keypoints: Array, descriptors: cv.Mat}>}
 */
export const detectFeatures = async (imageDataUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Load OpenCV first
      const cv = await loadOpenCV();
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // Create OpenCV Mat from image
          const src = cv.imread(img);
          
          // Convert to grayscale
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          
          // Create ORB detector
          const orb = new cv.ORB(500); // Max 500 features
          
          // Detect keypoints and compute descriptors
          const keypoints = new cv.KeyPointVector();
          const descriptors = new cv.Mat();
          const mask = new cv.Mat();
          
          orb.detectAndCompute(gray, mask, keypoints, descriptors);
          
          // Convert keypoints to plain objects for serialization
          const keypointsArray = [];
          for (let i = 0; i < keypoints.size(); i++) {
            const kp = keypoints.get(i);
            keypointsArray.push({
              x: kp.pt.x,
              y: kp.pt.y,
              size: kp.size,
              angle: kp.angle,
              response: kp.response,
              octave: kp.octave,
              class_id: kp.class_id
            });
          }
          
        // Clean up temporary mats (keep descriptors for matching)
        src.delete();
        gray.delete();
        mask.delete();
        keypoints.delete();
        
        resolve({
          keypoints: keypointsArray,
          descriptors: descriptors, // Keep Mat for matching (caller must delete)
          descriptorSize: descriptors.cols,
          featureCount: keypointsArray.length
        });
        } catch (error) {
          reject(new Error(`Feature detection failed: ${error.message}`));
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
 * Match features between two images using brute force matcher
 * @param {cv.Mat} descriptors1 - Descriptors from first image
 * @param {cv.Mat} descriptors2 - Descriptors from second image
 * @returns {Promise<{matches: Array, goodMatches: Array, matchScore: number}>}
 */
export const matchFeatures = async (descriptors1, descriptors2) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Load OpenCV first
      const cv = await loadOpenCV();
      
      if (!descriptors1 || !descriptors2 || descriptors1.rows === 0 || descriptors2.rows === 0) {
        resolve({
          matches: [],
          goodMatches: [],
          matchScore: 0
        });
        return;
      }
      
      // Create brute force matcher with Hamming distance (for ORB)
      const matcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
      
      // Match descriptors
      const matches = new cv.DMatchVector();
      matcher.match(descriptors1, descriptors2, matches);
      
      // Convert to array and filter good matches
      const matchesArray = [];
      for (let i = 0; i < matches.size(); i++) {
        matchesArray.push({
          queryIdx: matches.get(i).queryIdx,
          trainIdx: matches.get(i).trainIdx,
          distance: matches.get(i).distance
        });
      }
      
      // Filter good matches (distance < 50 for ORB)
      const goodMatches = matchesArray.filter(m => m.distance < 50);
      
      // Calculate match score (percentage of good matches)
      const matchScore = matchesArray.length > 0 
        ? goodMatches.length / matchesArray.length 
        : 0;
      
      // Clean up
      matcher.delete();
      matches.delete();
      
      resolve({
        matches: matchesArray,
        goodMatches: goodMatches,
        matchScore: matchScore,
        goodMatchCount: goodMatches.length,
        totalMatchCount: matchesArray.length
      });
    } catch (error) {
      reject(new Error(`Feature matching failed: ${error.message}`));
    }
  });
};

/**
 * Extract descriptor data as array for serialization
 * @param {cv.Mat} descriptors - OpenCV Mat containing descriptors
 * @returns {Array} Array of descriptor values
 */
export const extractDescriptorData = (descriptors) => {
  if (!descriptors || descriptors.rows === 0) {
    return null;
  }
  
  // ORB descriptors are binary (32 bytes = 256 bits)
  const data = [];
  for (let i = 0; i < descriptors.rows; i++) {
    const row = [];
    for (let j = 0; j < descriptors.cols; j++) {
      row.push(descriptors.ucharPtr(i, j)[0]);
    }
    data.push(row);
  }
  
  return data;
};

/**
 * Reconstruct descriptors Mat from serialized data
 * @param {Array} descriptorData - Array of descriptor values
 * @returns {Promise<cv.Mat>} OpenCV Mat containing descriptors
 */
export const reconstructDescriptors = async (descriptorData) => {
  if (!descriptorData || descriptorData.length === 0) {
    return null;
  }
  
  // Load OpenCV first
  const cv = await loadOpenCV();
  
  // ORB descriptors are 32 bytes (256 bits)
  const rows = descriptorData.length;
  const cols = descriptorData[0].length;
  const descriptors = new cv.Mat(rows, cols, cv.CV_8UC1);
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      descriptors.ucharPtr(i, j)[0] = descriptorData[i][j];
    }
  }
  
  return descriptors;
};

