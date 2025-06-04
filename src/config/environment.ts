
/**
 * Environment configuration for EquipQR
 * Centralizes all environment variables and provides type-safe access
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: "https://oxeheowbfsshpyldlskb.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhlb3diZnNzaHB5bGRsc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTY2MDUsImV4cCI6MjA2MjM3MjYwNX0.fTBztDcwSK57B7cMM20gF6xwto27zyzlbO-GypqNi4s",
  projectRef: "oxeheowbfsshpyldlskb"
} as const;

// Application Configuration
export const APP_CONFIG = {
  baseUrl: "https://equipqr.ai",
  siteUrl: "https://equipqr.ai",
  environment: "production",
  debug: false
} as const;

// Third-party Service Configuration
export const SERVICE_CONFIG = {
  stripe: {
    publishableKey: ""
  },
  mapbox: {
    accessToken: ""
  }
} as const;

// Storage keys for consistent auth token management - FIXED to use exact Supabase format
export const STORAGE_KEYS = {
  authToken: `sb-${SUPABASE_CONFIG.projectRef}-auth-token`,
  authTokenCodeVerifier: `sb-${SUPABASE_CONFIG.projectRef}-auth-token-code-verifier`,
  supabaseAuthToken: "supabase.auth.token", // Legacy fallback
  authReturnTo: "authReturnTo",
  authRedirectCount: "authRedirectCount", 
  invitationPath: "invitationPath"
} as const;

/**
 * Validates that required environment variables are present
 */
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = {
    SUPABASE_URL: SUPABASE_CONFIG.url,
    SUPABASE_ANON_KEY: SUPABASE_CONFIG.anonKey
  };

  const missingVars: string[] = [];
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value.includes('your-') || value.includes('undefined')) {
      missingVars.push(key);
    }
  });

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Get auth callback URL for OAuth redirects
 */
export function getAuthCallbackUrl(): string {
  return `${APP_CONFIG.siteUrl}/auth/callback`;
}

/**
 * Get site URL with fallback handling
 */
export function getSiteUrl(): string {
  return APP_CONFIG.siteUrl;
}
