
/**
 * Privacy configuration service for managing user privacy preferences
 */

import { supabase } from '@/integrations/supabase/client';
import { AnonymizationConfig, DEFAULT_ANONYMIZATION_CONFIG } from '@/utils/privacy/anonymizationUtils';

export interface PrivacyPreferences {
  allow_analytics: boolean;
  allow_location_tracking: boolean;
  allow_detailed_device_info: boolean;
  data_retention_days: number;
}

const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  allow_analytics: false,
  allow_location_tracking: false,
  allow_detailed_device_info: false,
  data_retention_days: 30
};

/**
 * Get user privacy preferences from local storage or database
 */
export async function getUserPrivacyPreferences(userId?: string): Promise<PrivacyPreferences> {
  try {
    // For anonymous users, use local storage
    if (!userId) {
      const stored = localStorage.getItem('privacy_preferences');
      if (stored) {
        return { ...DEFAULT_PRIVACY_PREFERENCES, ...JSON.parse(stored) };
      }
      return DEFAULT_PRIVACY_PREFERENCES;
    }
    
    // For authenticated users, try to fetch from database
    // Note: This would require a privacy_preferences table in the database
    // For now, fall back to local storage
    const stored = localStorage.getItem('privacy_preferences');
    if (stored) {
      return { ...DEFAULT_PRIVACY_PREFERENCES, ...JSON.parse(stored) };
    }
    
    return DEFAULT_PRIVACY_PREFERENCES;
  } catch (error) {
    console.warn('Error getting privacy preferences:', error);
    return DEFAULT_PRIVACY_PREFERENCES;
  }
}

/**
 * Save user privacy preferences
 */
export async function savePrivacyPreferences(
  preferences: Partial<PrivacyPreferences>,
  userId?: string
): Promise<boolean> {
  try {
    const current = await getUserPrivacyPreferences(userId);
    const updated = { ...current, ...preferences };
    
    // Save to local storage for immediate use
    localStorage.setItem('privacy_preferences', JSON.stringify(updated));
    
    // TODO: For authenticated users, also save to database
    // This would require implementing a privacy_preferences table
    
    return true;
  } catch (error) {
    console.error('Error saving privacy preferences:', error);
    return false;
  }
}

/**
 * Convert privacy preferences to anonymization config
 */
export function preferencesToConfig(
  preferences: PrivacyPreferences,
  isAuthenticated: boolean
): AnonymizationConfig {
  return {
    anonymizeIpAddresses: !preferences.allow_analytics,
    sanitizeUserAgents: !preferences.allow_detailed_device_info,
    reduceFingerprinting: !preferences.allow_detailed_device_info,
    protectLocationData: !preferences.allow_location_tracking,
    sessionManagement: preferences.allow_analytics ? 'full' : 'reduced',
    retentionDays: preferences.data_retention_days
  };
}

/**
 * Check if user has given explicit consent for data collection
 */
export function hasUserConsent(preferences: PrivacyPreferences): boolean {
  return preferences.allow_analytics || 
         preferences.allow_location_tracking || 
         preferences.allow_detailed_device_info;
}

/**
 * Show privacy consent banner for new users
 */
export function shouldShowPrivacyBanner(): boolean {
  const hasSeenBanner = localStorage.getItem('privacy_banner_seen');
  return !hasSeenBanner;
}

/**
 * Mark privacy banner as seen
 */
export function markPrivacyBannerSeen(): void {
  localStorage.setItem('privacy_banner_seen', 'true');
}
