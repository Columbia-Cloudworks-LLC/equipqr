
import { Equipment } from '@/types';

// Internal cache to store equipment data
const equipmentCache: Map<string, Equipment[]> = new Map();
const cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cacheMetadata: Map<string, number> = new Map();

/**
 * Save equipment data to cache with timestamp
 */
export function saveEquipmentCache(cacheKey: string, data: Equipment[]) {
  equipmentCache.set(cacheKey, data);
  cacheMetadata.set(cacheKey, Date.now());
}

/**
 * Check if valid equipment data exists in cache
 */
export function checkEquipmentCache(cacheKey: string): Equipment[] | null {
  const timestamp = cacheMetadata.get(cacheKey);
  if (!timestamp || Date.now() - timestamp > cacheTTL) {
    return null;
  }
  
  return equipmentCache.get(cacheKey) || null;
}

/**
 * Clear equipment cache
 */
export function clearEquipmentCache() {
  equipmentCache.clear();
  cacheMetadata.clear();
}

/**
 * Clear equipment cache for a specific key
 */
export function bustEquipmentCache(cacheKey?: string) {
  if (cacheKey) {
    equipmentCache.delete(cacheKey);
    cacheMetadata.delete(cacheKey);
  } else {
    clearEquipmentCache();
  }
}
