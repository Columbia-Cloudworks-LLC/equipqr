
/**
 * Utilities for handling authentication callbacks
 */

/**
 * Returns the appropriate callback URL for authentication providers
 * based on the current environment
 */
export function getAuthCallbackUrl(): string {
  // Production URL - this should match what's configured in Supabase
  const PRODUCTION_URL = "https://equipqr-staging.vercel.app";
  
  // In development, use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `${window.location.origin}/auth/callback`;
  }
  
  // In production, use the production URL
  return `${PRODUCTION_URL}/auth/callback`;
}

/**
 * Returns the base site URL for the current environment
 */
export function getSiteUrl(): string {
  // Production URL - this should match what's configured in Supabase
  const PRODUCTION_URL = "https://equipqr-staging.vercel.app";
  
  // In development, use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return window.location.origin;
  }
  
  // In production, use the production URL
  return PRODUCTION_URL;
}
