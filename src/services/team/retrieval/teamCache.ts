
/**
 * Team caching utility functions for storing and retrieving team data
 */

const getCacheKey = (userId?: string) => userId ? 
  `cached_user_teams_${userId}` : 'cached_user_teams';
  
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: any[];
  timestamp: number;
}

/**
 * Cache team results in localStorage
 */
export function cacheTeams(teams: any[], userId?: string): void {
  try {
    const cacheData: CachedData = {
      data: teams,
      timestamp: Date.now()
    };
    const cacheKey = getCacheKey(userId);
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`Cached ${teams.length} teams for ${userId ? `user ${userId.slice(0, 8)}...` : 'current user'} at ${new Date().toISOString()}`);
  } catch (error) {
    console.warn('Failed to cache teams:', error);
  }
}

/**
 * Check for valid cached teams data
 * @param forceRefresh If true, ignore cache and return null
 * @param userId Optional user ID to get user-specific cache
 */
export function getCachedTeams(forceRefresh = false, userId?: string): any[] | null {
  try {
    if (forceRefresh) {
      console.log('Force refresh requested, ignoring cache');
      return null;
    }
    
    const cacheKey = getCacheKey(userId);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached) as CachedData;
    const now = Date.now();
    const cacheAge = now - parsedCache.timestamp;
    
    // Return cached data if it's still within TTL
    if (cacheAge < CACHE_TTL) {
      console.log(`Using cached teams (${parsedCache.data.length} items, age: ${Math.round(cacheAge/1000)}s)`);
      return parsedCache.data;
    }
    
    console.log(`Cache expired (age: ${Math.round(cacheAge/1000)}s > TTL: ${CACHE_TTL/1000}s)`);
    return null;
  } catch (error) {
    console.warn('Failed to read cached teams:', error);
    return null;
  }
}

/**
 * Clear the team cache
 * @param userId Optional user ID to clear specific user cache
 */
export function clearTeamCache(userId?: string): void {
  try {
    if (userId) {
      // Clear specific user cache
      localStorage.removeItem(getCacheKey(userId));
      console.log(`Team cache cleared for user ${userId.slice(0, 8)}...`);
    } else {
      // Find and clear all team cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cached_user_teams_')) {
          localStorage.removeItem(key);
        }
      }
      console.log('All team caches cleared');
    }
  } catch (error) {
    console.warn('Failed to clear team cache:', error);
  }
}
