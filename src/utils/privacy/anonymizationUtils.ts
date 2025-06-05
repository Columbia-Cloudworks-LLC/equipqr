/**
 * Privacy-focused anonymization utilities for scan tracking data
 * Implements various anonymization techniques to protect user privacy
 */

export interface AnonymizationConfig {
  anonymizeIpAddresses: boolean;
  sanitizeUserAgents: boolean;
  reduceFingerprinting: boolean;
  protectLocationData: boolean;
  sessionManagement: 'full' | 'reduced' | 'none';
  retentionDays: number;
}

export const DEFAULT_ANONYMIZATION_CONFIG: AnonymizationConfig = {
  anonymizeIpAddresses: true,
  sanitizeUserAgents: true,
  reduceFingerprinting: true,
  protectLocationData: true,
  sessionManagement: 'reduced',
  retentionDays: 90
};

/**
 * Anonymize IP address using subnet masking
 */
export function anonymizeIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) return null;
  
  try {
    // IPv4 anonymization - mask last octet
    if (ipAddress.includes('.') && !ipAddress.includes(':')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    // IPv6 anonymization - mask last 64 bits
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length >= 4) {
        // Keep first 4 groups (64 bits), anonymize the rest
        return `${parts.slice(0, 4).join(':')}::`;
      }
    }
    
    // Fallback for unknown formats
    return 'anonymized';
  } catch (error) {
    console.warn('Error anonymizing IP address:', error);
    return 'anonymized';
  }
}

/**
 * Sanitize user agent string to remove identifying information
 */
export function sanitizeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;
  
  try {
    // Remove version numbers and specific identifying information
    let sanitized = userAgent
      // Remove detailed version numbers, keep major versions only
      .replace(/(\d+)\.[\d.]+/g, '$1.x')
      // Remove WebKit build numbers
      .replace(/WebKit\/[\d.]+/g, 'WebKit/xxx')
      // Remove Chrome build numbers
      .replace(/Chrome\/[\d.]+/g, 'Chrome/xxx')
      // Remove Safari build numbers
      .replace(/Safari\/[\d.]+/g, 'Safari/xxx')
      // Remove Firefox build numbers
      .replace(/Firefox\/[\d.]+/g, 'Firefox/xxx')
      // Remove Edge build numbers
      .replace(/Edg\/[\d.]+/g, 'Edge/xxx')
      // Remove OS build numbers
      .replace(/Windows NT [\d.]+/g, 'Windows NT x.x')
      .replace(/Mac OS X [\d_]+/g, 'Mac OS X x_x')
      .replace(/Android [\d.]+/g, 'Android x.x')
      .replace(/iOS [\d_]+/g, 'iOS x_x');
    
    // Limit length to prevent fingerprinting through user agent length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '...';
    }
    
    return sanitized;
  } catch (error) {
    console.warn('Error sanitizing user agent:', error);
    return 'sanitized-browser';
  }
}

/**
 * Create a reduced device fingerprint that's less identifying
 */
export function createReducedFingerprint(): string {
  try {
    // Use only general device characteristics, not unique identifiers
    const components = [
      screen.width > 1920 ? 'large-screen' : screen.width > 1366 ? 'medium-screen' : 'small-screen',
      screen.colorDepth > 24 ? 'high-color' : 'standard-color',
      navigator.language ? navigator.language.split('-')[0] : 'unknown', // Only language, not region
      navigator.platform ? getPlatformCategory(navigator.platform) : 'unknown',
      navigator.cookieEnabled ? 'cookies-enabled' : 'cookies-disabled',
      typeof localStorage !== 'undefined' ? 'storage-available' : 'no-storage'
    ];
    
    // Simple hash that produces similar results for similar configurations
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Return a short, less unique fingerprint
    return Math.abs(hash).toString(16).substring(0, 6);
  } catch (error) {
    console.warn('Error creating reduced fingerprint:', error);
    return 'reduced';
  }
}

/**
 * Categorize platform to reduce uniqueness
 */
function getPlatformCategory(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('win')) return 'windows';
  if (p.includes('mac')) return 'macos';
  if (p.includes('linux')) return 'linux';
  if (p.includes('android')) return 'android';
  if (p.includes('iphone') || p.includes('ipad')) return 'ios';
  return 'other';
}

/**
 * Anonymize location data by reducing precision
 */
export function anonymizeLocation(latitude: number | null, longitude: number | null): {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
} {
  if (latitude === null || longitude === null) {
    return { latitude: null, longitude: null, accuracy: null };
  }
  
  try {
    // Reduce precision to approximately 1km accuracy
    // This provides general area without pinpointing exact location
    const reducedLat = Math.round(latitude * 100) / 100; // ~1.1km precision
    const reducedLng = Math.round(longitude * 100) / 100; // ~1.1km precision
    
    return {
      latitude: reducedLat,
      longitude: reducedLng,
      accuracy: 1000 // Indicate reduced accuracy
    };
  } catch (error) {
    console.warn('Error anonymizing location:', error);
    return { latitude: null, longitude: null, accuracy: null };
  }
}

/**
 * Generate a privacy-friendly session ID
 */
export function generatePrivacyFriendlySessionId(): string {
  try {
    // Create a session ID that's useful for analytics but not persistent tracking
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Hour-based
    const random = Math.random().toString(36).substring(2, 8); // Short random component
    return `${timestamp}-${random}`;
  } catch (error) {
    console.warn('Error generating privacy-friendly session ID:', error);
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Check if data should be collected based on user consent and configuration
 */
export function shouldCollectData(config: AnonymizationConfig, hasUserConsent: boolean = false): boolean {
  // For anonymous users, we collect minimal data only
  // For authenticated users with consent, we can collect more
  return hasUserConsent || config.sessionManagement !== 'none';
}

/**
 * Apply anonymization to scan data based on configuration
 */
export function anonymizeScanData(
  data: any,
  config: AnonymizationConfig = DEFAULT_ANONYMIZATION_CONFIG,
  hasUserConsent: boolean = false
): any {
  const anonymized = { ...data };
  
  // Apply IP anonymization
  if (config.anonymizeIpAddresses) {
    anonymized.scanned_from_ip = null; // Don't collect IP for privacy
  }
  
  // Apply user agent sanitization
  if (config.sanitizeUserAgents && anonymized.user_agent) {
    anonymized.user_agent = sanitizeUserAgent(anonymized.user_agent);
  }
  
  // Apply fingerprint reduction
  if (config.reduceFingerprinting && anonymized.device_fingerprint) {
    anonymized.device_fingerprint = createReducedFingerprint();
  }
  
  // Apply location anonymization
  if (config.protectLocationData && (anonymized.latitude || anonymized.longitude)) {
    const { latitude, longitude, accuracy } = anonymizeLocation(
      anonymized.latitude,
      anonymized.longitude
    );
    anonymized.latitude = latitude;
    anonymized.longitude = longitude;
    anonymized.location_accuracy = accuracy;
  }
  
  // Apply session management
  if (config.sessionManagement === 'reduced') {
    anonymized.session_id = generatePrivacyFriendlySessionId();
  } else if (config.sessionManagement === 'none') {
    anonymized.session_id = null;
  }
  
  // Remove sensitive fields for anonymous users
  if (!hasUserConsent) {
    delete anonymized.referrer_url;
    delete anonymized.screen_resolution;
  }
  
  return anonymized;
}

/**
 * Get anonymization configuration based on user authentication status
 */
export function getAnonymizationConfig(isAuthenticated: boolean): AnonymizationConfig {
  if (isAuthenticated) {
    // Authenticated users can opt-in to more data collection
    return {
      ...DEFAULT_ANONYMIZATION_CONFIG,
      sessionManagement: 'full',
      retentionDays: 365
    };
  } else {
    // Anonymous users get maximum privacy protection
    return {
      ...DEFAULT_ANONYMIZATION_CONFIG,
      anonymizeIpAddresses: true,
      sanitizeUserAgents: true,
      reduceFingerprinting: true,
      protectLocationData: true,
      sessionManagement: 'reduced',
      retentionDays: 30
    };
  }
}
