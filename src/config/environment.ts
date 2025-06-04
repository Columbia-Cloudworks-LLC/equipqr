
/**
 * Environment configuration for EquipQR
 * Centralizes all environment variables and provides type-safe access
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || "https://oxeheowbfsshpyldlskb.supabase.co",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhlb3diZnNzaHB5bGRsc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTY2MDUsImV4cCI6MjA2MjM3MjYwNX0.fTBztDcwSK57B7cMM20gF6xwto27zyzlbO-GypqNi4s",
  projectRef: "oxeheowbfsshpyldlskb"
} as const;

// Application Configuration
export const APP_CONFIG = {
  baseUrl: import.meta.env.VITE_APP_BASE_URL || "http://localhost:5173",
  siteUrl: import.meta.env.VITE_SITE_URL || "http://localhost:5173",
  environment: import.meta.env.NODE_ENV || "development",
  debug: import.meta.env.VITE_DEBUG === "true" || false
} as const;

// Third-party Service Configuration
export const SERVICE_CONFIG = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
  },
  mapbox: {
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ""
  }
} as const;

// Storage keys for consistent auth token management
export const STORAGE_KEYS = {
  authToken: `sb-${SUPABASE_CONFIG.projectRef}-auth-token`,
  authTokenCodeVerifier: `sb-${SUPABASE_CONFIG.projectRef}-auth-token-code-verifier`,
  supabaseAuthToken: "supabase.auth.token",
  authReturnTo: "authReturnTo",
  authRedirectCount: "authRedirectCount",
  invitationPath: "invitationPath"
} as const;

/**
 * Validates that required environment variables are present
 */
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = {
    VITE_SUPABASE_URL: SUPABASE_CONFIG.url,
    VITE_SUPABASE_ANON_KEY: SUPABASE_CONFIG.anonKey
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
