
import { FeatureFlags } from '@/config/app';

/**
 * Maps between API feature keys (snake_case) and config feature keys (camelCase)
 */
export const FEATURE_KEY_MAPPING = {
  // API key -> Config key
  'fleet_map': 'fleetMap',
  'work_orders': 'workOrders', 
  'advanced_reporting': 'advancedReporting',
  'bulk_operations': 'bulkOperations',
  'real_time_sync': 'realTimeSync'
} as const;

/**
 * Converts API feature key to config feature key
 */
export function apiToConfigFeatureKey(apiKey: string): keyof typeof FeatureFlags | null {
  return FEATURE_KEY_MAPPING[apiKey as keyof typeof FEATURE_KEY_MAPPING] || null;
}

/**
 * Converts config feature key to API feature key
 */
export function configToApiFeatureKey(configKey: keyof typeof FeatureFlags): string {
  const entry = Object.entries(FEATURE_KEY_MAPPING).find(([, value]) => value === configKey);
  return entry?.[0] || configKey;
}

/**
 * Validates that a feature key exists in the configuration
 */
export function isValidFeatureKey(featureKey: string): boolean {
  const configKey = apiToConfigFeatureKey(featureKey);
  return configKey !== null && configKey in FeatureFlags;
}
