/**
 * Gets the higher priority role between team role and org role
 */
export function getHigherRole(teamRole: string | null, orgRole: string | null): string | null {
  // Role priority from highest to lowest
  const rolePriority = ['owner', 'manager', 'admin', 'creator', 'technician', 'viewer'];
  
  // If only one role exists, return it
  if (!teamRole) return orgRole;
  if (!orgRole) return teamRole;
  
  // Find the priority index for each role
  const teamPriority = rolePriority.indexOf(teamRole);
  const orgPriority = rolePriority.indexOf(orgRole);
  
  // Lower index means higher priority
  // If org role is owner or manager, it should take precedence
  if (orgRole === 'owner' || orgRole === 'manager') {
    return orgRole;
  }
  
  // Otherwise, return the higher priority role (lower index)
  return teamPriority < orgPriority ? teamRole : orgRole;
}

/**
 * Determines the access reason based on membership details
 */
export function determineAccessReason(
  membershipType?: string, 
  teamRole?: string | null, 
  orgRole?: string | null,
  hasSameOrg?: boolean,
  hasCrossOrg?: boolean
): string {
  // Direct team membership takes precedence
  if (membershipType === 'team_member') {
    return 'team_member';
  }
  
  // If they're in the same org and user has manager/owner role
  if (hasSameOrg && orgRole && (orgRole === 'owner' || orgRole === 'manager')) {
    return 'org_manager_access';
  }
  
  // Same org but no direct team membership
  if (hasSameOrg) {
    return 'same_org';
  }
  
  // Cross-org access via team
  if (hasCrossOrg) {
    return 'cross_org_team';
  }
  
  // Default - no clear reason for access
  return 'none';
}
