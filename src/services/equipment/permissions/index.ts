
import { PermissionResult } from './types';
import { checkCreatePermission } from './edgeFunction';
import { fallbackPermissionCheck, directDatabasePermissionCheck } from './fallbackChecks';
import { invokeEdgeFunction } from '@/utils/edgeFunctions';
import { retry } from '@/utils/edgeFunctions/retry';

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
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  try {
    // Try with the edge function first with retry
    return await retry(
      () => invokeEdgeFunction(
        'create_equipment_permission', 
        { user_id: authUserId, team_id: teamId, org_id: orgId }
      ),
      {
        maxRetries: 2,
        retryDelay: 1000
      }
    );
  } catch (error) {
    console.warn('Edge function permission check failed, using fallback:', error);
    
    try {
      // First try the standard edge function approach if retry failed
      return await checkCreatePermission(authUserId, teamId, orgId);
    } catch (edgeError) {
      console.warn('Primary permission check failed, using database fallback:', edgeError);
      
      // Use the fallback if the main approach fails
      return await fallbackPermissionCheck(authUserId, teamId, orgId);
    }
  }
}
