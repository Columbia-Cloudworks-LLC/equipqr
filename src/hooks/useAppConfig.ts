
import { useMemo } from 'react';
import { Config } from '@/config/app';

/**
 * Hook for accessing application configuration
 * Provides a centralized way to access configuration values throughout the app
 */
export function useAppConfig() {
  const config = useMemo(() => Config, []);

  // Helper functions for common configuration checks
  const isFeatureEnabled = (featureKey: keyof typeof Config.features) => {
    return Config.features[featureKey]?.enabled ?? false;
  };

  const requiresSubscription = (featureKey: keyof typeof Config.features) => {
    return Config.features[featureKey]?.requiresSubscription ?? false;
  };

  const getApiConfig = () => Config.api;
  const getUIConfig = () => Config.ui;
  const getDataConfig = () => Config.data;
  const getSecurityConfig = () => Config.security;
  const getMapConfig = () => Config.map;
  const getRegionalConfig = () => Config.regional;

  return {
    config,
    isFeatureEnabled,
    requiresSubscription,
    getApiConfig,
    getUIConfig,
    getDataConfig,
    getSecurityConfig,
    getMapConfig,
    getRegionalConfig
  };
}

/**
 * Hook specifically for feature flag checks
 */
export function useFeatureFlag(featureKey: keyof typeof Config.features) {
  const { isFeatureEnabled, requiresSubscription } = useAppConfig();
  
  return {
    enabled: isFeatureEnabled(featureKey),
    requiresSubscription: requiresSubscription(featureKey)
  };
}
