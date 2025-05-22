
import { Equipment } from "@/types";
import { saveEquipmentCache } from "../../caching/equipmentCache";

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
 * Save equipment data to the cache
 * @param userId User ID
 * @param equipment Equipment data to cache
 * @param orgId Optional organization ID
 */
export function cacheEquipmentData(userId: string, equipment: Equipment[], orgId?: string): void {
  const cacheKey = generateCacheKey(userId, orgId);
  saveEquipmentCache(cacheKey, equipment);
}
