
/**
 * Get the site URL for auth redirects
 */
export function getSiteUrl() {
  return window.location.origin;
}

/**
 * Get the callback URL for authentication redirects
 */
export function getAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`;
}
