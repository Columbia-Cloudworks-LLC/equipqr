
/**
 * Device detection and fingerprinting utilities for audit purposes
 */

export interface DeviceInfo {
  userAgent: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  screenResolution: string;
  timezone: string;
  language: string;
  deviceFingerprint: string;
}

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

/**
 * Extract device information from user agent and browser APIs
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Parse device type
  const deviceType = getDeviceType(userAgent);
  
  // Parse browser info
  const { name: browserName, version: browserVersion } = getBrowserInfo(userAgent);
  
  // Parse OS
  const operatingSystem = getOperatingSystem(userAgent);
  
  // Screen resolution
  const screenResolution = `${screen.width}x${screen.height}`;
  
  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Language
  const language = navigator.language || navigator.languages?.[0] || 'unknown';
  
  // Generate device fingerprint
  const deviceFingerprint = generateDeviceFingerprint();
  
  return {
    userAgent,
    deviceType,
    browserName,
    browserVersion,
    operatingSystem,
    screenResolution,
    timezone,
    language,
    deviceFingerprint
  };
}

/**
 * Get user location if permission is granted
 */
export function getLocationInfo(): Promise<LocationInfo> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        // Location permission denied or error - that's fine
        resolve({});
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

function getDeviceType(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function getBrowserInfo(userAgent: string): { name: string; version: string } {
  // Chrome
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Chrome', version: match?.[1] || 'unknown' };
  }
  
  // Edge
  if (userAgent.includes('Edg/')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: 'Edge', version: match?.[1] || 'unknown' };
  }
  
  // Firefox
  if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'Firefox', version: match?.[1] || 'unknown' };
  }
  
  // Safari
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'Safari', version: match?.[1] || 'unknown' };
  }
  
  return { name: 'Unknown', version: 'unknown' };
}

function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows NT')) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    return `Windows ${match?.[1] || 'Unknown'}`;
  }
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    return `macOS ${match?.[1]?.replace(/_/g, '.') || 'Unknown'}`;
  }
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+)/);
    return `Android ${match?.[1] || 'Unknown'}`;
  }
  if (userAgent.includes('iPhone OS') || userAgent.includes('iOS')) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    return `iOS ${match?.[1]?.replace(/_/g, '.') || 'Unknown'}`;
  }
  return 'Unknown';
}

function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled,
    typeof localStorage !== 'undefined'
  ];
  
  // Simple hash function for fingerprinting
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Generate a session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get or create session ID from sessionStorage
 */
export function getSessionId(): string {
  const existingSessionId = sessionStorage.getItem('equipqr_session_id');
  if (existingSessionId) {
    return existingSessionId;
  }
  
  const newSessionId = generateSessionId();
  sessionStorage.setItem('equipqr_session_id', newSessionId);
  return newSessionId;
}
