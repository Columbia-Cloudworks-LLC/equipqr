
import { Equipment } from "@/types";
import { clearEquipmentCache, bustEquipmentCache, checkEquipmentCache } from "../caching/equipmentCache";
import { clearCacheByPrefix } from "@/utils/storage/clientCache";

/**
 * Generate a cache key based on user ID and optional org ID
 * @param userId User ID
 * @param orgId Optional organization ID
 * @returns Cache key string
 */
export function generateCacheKey(userId: string, orgId?: string): string {
  return orgId ? `${userId}_${orgId}` : userId;
}

/**
 * Check equipment cache and return data if valid
 * @param userId User ID
 * @param orgId Optional organization ID
 * @returns Equipment data or null if no valid cache exists
 */
export function getEquipmentFromCache(userId: string, orgId?: string): Equipment[] | null {
  const cacheKey = generateCacheKey(userId, orgId);
  return checkEquipmentCache(cacheKey);
}

/**
 * Bust cache for specific user/org combination or all equipment cache
 * @param userId Optional user ID
 * @param orgId Optional organization ID
 * @param equipmentId Optional equipment ID for targeted invalidation
 */
export function invalidateEquipmentCache(userId?: string, orgId?: string, equipmentId?: string): void {
  // Invalidate in-memory equipment cache
  if (userId) {
    const cacheKey = generateCacheKey(userId, orgId);
    bustEquipmentCache(cacheKey);
  } else {
    bustEquipmentCache();
  }
  
  // Also clear any session storage cache
  clearCacheByPrefix('equipment_');
  
  // If we have a specific equipment ID, also clear its detail cache
  if (equipmentId) {
    clearCacheByPrefix(`equipment_${equipmentId}`);
  }
}

// Re-export cache clearing function for use during login/logout
export { clearEquipmentCache };
