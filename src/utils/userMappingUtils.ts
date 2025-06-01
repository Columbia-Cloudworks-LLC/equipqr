
/**
 * This file contains utilities for user mapping that were used when we incorrectly
 * tried to map auth.users.id to app_user.id for equipment creation.
 * 
 * These functions are now DEPRECATED and should not be used.
 * All equipment creation now uses auth.users.id directly.
 */

/**
 * @deprecated - No longer used for equipment creation
 * Equipment creation now uses auth.users.id directly
 */
export async function getAppUserIdFromAuthId(authUserId: string): Promise<string | null> {
  console.warn('getAppUserIdFromAuthId is deprecated - use auth.users.id directly');
  return null;
}

/**
 * @deprecated - No longer used for equipment creation
 * Equipment creation now uses auth.users.id directly
 */
export async function ensureAppUserExists(authUserId: string, email?: string, displayName?: string): Promise<string | null> {
  console.warn('ensureAppUserExists is deprecated - use auth.users.id directly');
  return null;
}
