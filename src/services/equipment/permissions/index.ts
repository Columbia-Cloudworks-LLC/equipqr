
import { PermissionResult } from './types';
import { checkCreatePermission } from './edgeFunction';
import { fallbackPermissionCheck, directDatabasePermissionCheck } from './fallbackChecks';

// Re-export the main permission checking functions and types
export { 
  checkCreatePermission,
  fallbackPermissionCheck, 
  directDatabasePermissionCheck 
};

export type { PermissionResult };

/**
 * Main entry point for checking equipment creation permissions
 * Tries multiple approaches with fallbacks for reliability
 */
export async function checkEquipmentCreatePermission(
  authUserId: string, 
  teamId?: string | null
): Promise<PermissionResult> {
  try {
    // Try the primary edge function first
    return await checkCreatePermission(authUserId, teamId);
  } catch (error) {
    console.warn('Primary permission check failed, using fallback:', error);
    
    // Use the fallback if the main approach fails
    return await fallbackPermissionCheck(authUserId, teamId);
  }
}
