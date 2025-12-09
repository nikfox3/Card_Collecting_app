import { get } from './database.js';

/**
 * Check if a user has active pro membership
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user has active pro membership
 */
export async function isProMember(userId) {
  if (!userId) return false;
  
  try {
    const user = await get(
      'SELECT is_pro, pro_expires_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) return false;
    
    // Check if user is marked as pro and membership hasn't expired
    if (user.is_pro === 1 || user.is_pro === true) {
      // If there's an expiration date, check if it's still valid
      if (user.pro_expires_at) {
        const expiresAt = new Date(user.pro_expires_at);
        const now = new Date();
        return expiresAt > now;
      }
      // If no expiration date, assume lifetime pro (or check based on your business logic)
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking pro membership:', error);
    return false;
  }
}

/**
 * Get user's deck count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of decks user has
 */
export async function getUserDeckCount(userId) {
  if (!userId) return 0;
  
  try {
    const result = await get(
      'SELECT COUNT(*) as count FROM decks WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting deck count:', error);
    return 0;
  }
}

/**
 * Get user's binder count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of binders user has
 */
export async function getUserBinderCount(userId) {
  if (!userId) return 0;
  
  try {
    const result = await get(
      'SELECT COUNT(*) as count FROM binders WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting binder count:', error);
    return 0;
  }
}

/**
 * Get binder's page count
 * @param {string} binderId - Binder ID
 * @returns {Promise<number>} - Number of pages in binder
 */
export async function getBinderPageCount(binderId) {
  if (!binderId) return 0;
  
  try {
    const result = await get(
      'SELECT COUNT(*) as count FROM binder_pages WHERE binder_id = ?',
      [binderId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting page count:', error);
    return 0;
  }
}

