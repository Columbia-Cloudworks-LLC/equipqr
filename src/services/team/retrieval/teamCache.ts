
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
    console.log(`Cached ${teams.length} teams at ${new Date().toISOString()}`);
  } catch (error) {
    console.warn('Failed to cache teams:', error);
  }
}

/**
 * Check for valid cached teams data
 * @param forceRefresh If true, ignore cache and return null
 */
export function getCachedTeams(forceRefresh = false): any[] | null {
  try {
    if (forceRefresh) {
      console.log('Force refresh requested, ignoring cache');
      return null;
    }
    
    const cached = localStorage.getItem(CACHE_KEY);
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
 */
export function clearTeamCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('Team cache cleared');
  } catch (error) {
    console.warn('Failed to clear team cache:', error);
  }
}
