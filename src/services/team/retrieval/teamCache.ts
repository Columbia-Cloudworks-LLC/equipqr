
import { Team } from '../../team';

// Internal cache to store team data
const teamCache: Map<string, Team[]> = new Map();
const cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cacheMetadata: Map<string, number> = new Map();

/**
 * Save team data to cache with timestamp
 */
export function saveTeamCache(cacheKey: string, data: Team[]) {
  teamCache.set(cacheKey, data);
  cacheMetadata.set(cacheKey, Date.now());
}

/**
 * Check if valid team data exists in cache
 */
export function checkTeamCache(cacheKey: string): Team[] | null {
  const timestamp = cacheMetadata.get(cacheKey);
  if (!timestamp || Date.now() - timestamp > cacheTTL) {
    return null;
  }
  
  return teamCache.get(cacheKey) || null;
}

/**
 * Clear team cache
 */
export function clearTeamCache() {
  teamCache.clear();
  cacheMetadata.clear();
}

/**
 * Process team data from the database
 */
export function processTeamData(teams: Team[]): Team[] {
  if (!Array.isArray(teams)) {
    console.error('Expected teams to be an array but got:', typeof teams);
    return [];
  }
  
  return teams.map(team => ({
    ...team,
    // Ensure these properties always exist for consistent rendering
    is_external: team.is_external || false,
    role: team.role || null,
    org_name: team.org_name || 'Unknown Organization'
  }));
}
