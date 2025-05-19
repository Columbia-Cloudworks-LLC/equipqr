
/**
 * Type definitions for permission checking functionality
 */

export interface PermissionResult {
  canCreate: boolean;
  orgId: string | null;
  reason?: string;
}

export interface EdgePermissionResponse {
  can_create?: boolean;
  has_permission?: boolean;
  org_id?: string;
  reason?: string;
  error?: string;
  status?: number;
}

export interface DirectDBPermissionResult {
  permission_check?: { 
    has_permission?: boolean;
    org_id?: string;
    reason?: string;
  };
  user_info?: {
    user_org_id?: string;
    auth_user_id?: string;
    app_user_id?: string;
  };
  test_status?: string;
}
