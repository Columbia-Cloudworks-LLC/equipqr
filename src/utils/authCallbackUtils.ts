
import { APP_CONFIG } from '@/config/environment';

/**
 * Get the site URL for authentication redirects
 */
export function getSiteUrl(): string {
  return APP_CONFIG.siteUrl;
}

/**
 * Get the authentication callback URL
 */
export function getAuthCallbackUrl(): string {
  return `${APP_CONFIG.siteUrl}/auth/callback`;
}
