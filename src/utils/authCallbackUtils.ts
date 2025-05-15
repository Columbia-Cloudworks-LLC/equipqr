
/**
 * Utilities for handling authentication callbacks
 */

/**
 * Returns the appropriate callback URL for authentication providers
 * based on the current environment
 */
export function getAuthCallbackUrl(): string {
  // Production URLs - these should match what's configured in Supabase
  const STAGING_URL = "https://equipqr-staging.vercel.app";
  const PRODUCTION_URL = "https://equipqr.ai";
  
  // In development, use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `${window.location.origin}/auth/callback`;
  }
  
  // If we're on the production domain
  if (window.location.hostname === "equipqr.ai") {
    return `${PRODUCTION_URL}/auth/callback`;
  }
  
  // Default to staging URL for other environments
  return `${STAGING_URL}/auth/callback`;
}

/**
 * Returns the base site URL for the current environment
 */
export function getSiteUrl(): string {
  // Production URLs - these should match what's configured in Supabase
  const STAGING_URL = "https://equipqr-staging.vercel.app";
  const PRODUCTION_URL = "https://equipqr.ai";
  
  // In development, use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return window.location.origin;
  }
  
  // If we're on the production domain
  if (window.location.hostname === "equipqr.ai") {
    return PRODUCTION_URL;
  }
  
  // Default to staging URL for other environments
  return STAGING_URL;
}
