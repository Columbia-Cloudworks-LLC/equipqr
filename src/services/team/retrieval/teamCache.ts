
/**
 * Team caching utility functions for storing and retrieving team data
 */

const CACHE_KEY = 'cached_user_teams';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: any[];
  timestamp: number;
}

/**
 * Cache team results in localStorage
 */
export function cacheTeams(teams: any[]): void {
  try {
    const cacheData: CachedData = {
      data: teams,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache teams:', error);
  }
}

/**
 * Check for valid cached teams data
 */
export function getCachedTeams(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached) as CachedData;
    const now = Date.now();
    
    // Return cached data if it's still within TTL
    if (now - parsedCache.timestamp < CACHE_TTL) {
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read cached teams:', error);
    return null;
  }
}

/**
 * Clear the team cache
 */
export function clearTeamCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear team cache:', error);
  }
}
