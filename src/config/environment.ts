
/**
 * Environment detection and configuration
 * Provides environment-specific settings to prevent session mixing
 */

export type Environment = 'development' | 'production' | 'staging';

/**
 * Detect the current environment
 */
export function detectEnvironment(): Environment {
  // Check for explicit environment variables first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production detection
    if (hostname.includes('equipqr.com') || 
        hostname.includes('app.equipqr') ||
        (protocol === 'https:' && !hostname.includes('localhost'))) {
      return 'production';
    }
    
    // Staging detection
    if (hostname.includes('staging') || 
        hostname.includes('preview') ||
        hostname.includes('test')) {
      return 'staging';
    }
    
    // Development detection (localhost, IP addresses, dev domains)
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('192.168.') ||
        hostname.includes('dev') ||
        hostname.includes('local')) {
      return 'development';
    }
  }
  
  // Default to development for safety
  return 'development';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = detectEnvironment();
  
  return {
    environment: env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isStaging: env === 'staging',
    
    // Storage keys should be environment-specific
    storagePrefix: `equipqr-${env}`,
    
    // Session isolation
    sessionNamespace: env,
    
    // Debug settings
    enableDebugLogs: env === 'development',
    enableVerboseAuth: env === 'development',
    
    // API endpoints (if they differ by environment)
    apiBaseUrl: env === 'production' 
      ? 'https://api.equipqr.com' 
      : 'https://api-dev.equipqr.com'
  };
}

/**
 * Environment-aware storage key generator
 */
export function createEnvironmentStorageKey(baseKey: string): string {
  const config = getEnvironmentConfig();
  return `${config.storagePrefix}-${baseKey}`;
}

/**
 * Check if we're in a cross-environment situation
 */
export function detectCrossEnvironmentSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  const currentEnv = detectEnvironment();
  
  // Check for session keys from other environments
  const otherEnvs: Environment[] = ['development', 'production', 'staging']
    .filter(env => env !== currentEnv) as Environment[];
  
  for (const env of otherEnvs) {
    const otherPrefix = `equipqr-${env}`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(otherPrefix)) {
        console.warn(`Cross-environment session detected: Found ${env} session in ${currentEnv} environment`);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Clean up sessions from other environments
 */
export function cleanCrossEnvironmentSessions(): void {
  if (typeof window === 'undefined') return;
  
  const currentEnv = detectEnvironment();
  const currentPrefix = `equipqr-${currentEnv}`;
  
  const keysToRemove: string[] = [];
  
  // Find keys that don't belong to current environment
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && 
        (key.startsWith('equipqr-') || key.startsWith('sb-')) && 
        !key.startsWith(currentPrefix)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove cross-environment keys
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log(`Cleaned cross-environment session key: ${key}`);
    } catch (error) {
      console.error(`Failed to remove cross-environment key ${key}:`, error);
    }
  });
  
  if (keysToRemove.length > 0) {
    console.log(`Cleaned ${keysToRemove.length} cross-environment session keys`);
  }
}
