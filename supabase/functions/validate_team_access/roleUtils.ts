import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Get the higher role based on permission level
 */
export function getHigherRole(role1: string | null, role2: string | null): string | null {
  if (!role1) return role2;
  if (!role2) return role1;
  
  // Define role hierarchy from highest to lowest permission level
  const roleHierarchy = ['owner', 'admin', 'manager', 'creator', 'technician', 'viewer', 'member'];
  
  const role1Index = roleHierarchy.indexOf(role1);
  const role2Index = roleHierarchy.indexOf(role2);
  
  // If role isn't in our hierarchy, default to the other role
  if (role1Index === -1) return role2;
  if (role2Index === -1) return role1;
  
  // Lower index = higher permission
  return role1Index < role2Index ? role1 : role2;
}

/**
 * Determine the access reason
 */
export function determineAccessReason(
  initialReason: string | undefined,
  teamRole: string | null,
  orgRole: string | null,
  hasOrgAccess: boolean,
  hasCrossOrgAccess: boolean
): string {
  // If we have an initial reason from the database function, use that
  if (initialReason && initialReason !== 'none') {
    return initialReason;
  }
  
  // Otherwise determine based on available data
  if (teamRole) {
    return 'team_member';
  } else if (orgRole && hasOrgAccess) {
    return 'org_role';
  } else if (hasOrgAccess) {
    return 'same_org';
  } else if (hasCrossOrgAccess) {
    return 'cross_org_access';
  }
  
  return 'unknown';
}
