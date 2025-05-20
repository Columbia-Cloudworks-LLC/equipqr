
/**
 * Equipment caching functionality
 */
import { Equipment } from "@/types";

// Cache TTL in milliseconds (5 minutes)
export const EQUIPMENT_CACHE_TTL = 5 * 60 * 1000;

interface CachedData {
  data: Equipment[];
  timestamp: number;
}

// Include user ID in cache key to prevent using data from previous users
export const getCacheKey = (userId: string) => `cached_user_equipment_${userId}`;

/**
 * Cache equipment results in localStorage
 */
export function cacheEquipmentResults(equipment: Equipment[], userId: string) {
  try {
    const cacheKey = getCacheKey(userId);
    const cacheData: CachedData = {
      data: equipment,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache equipment:', error);
  }
}

/**
 * Check for valid cached equipment data
 */
export function checkEquipmentCache(userId: string): Equipment[] | null {
  try {
    const cacheKey = getCacheKey(userId);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached) as CachedData;
    const now = Date.now();
    
    // Return cached data if it's still within TTL
    if (now - parsedCache.timestamp < EQUIPMENT_CACHE_TTL) {
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read cached equipment:', error);
    return null;
  }
}

/**
 * Clear all equipment caches (used during login/logout)
 */
export function clearEquipmentCache(): void {
  console.log('Clearing all equipment caches');
  
  // Find and clear all equipment cache entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cached_user_equipment_')) {
      localStorage.removeItem(key);
    }
  }
  
  // Also remove the general cache bust flag
  localStorage.removeItem('equipment_cache_bust');
}

/**
 * Force refresh equipment data by busting the cache
 */
export function bustEquipmentCache(userId?: string): void {
  // Set cache bust flag
  window.localStorage.setItem('equipment_cache_bust', 'true');
  
  // Clear specific user cache if provided
  if (userId) {
    window.localStorage.removeItem(getCacheKey(userId));
  }
}
