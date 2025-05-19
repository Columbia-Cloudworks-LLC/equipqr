
/**
 * Common interface for permission check results
 */
export interface PermissionResult {
  authUserId: string;
  teamId: string | null;
  orgId: string | null;
  hasPermission: boolean;
  reason: string;
}
