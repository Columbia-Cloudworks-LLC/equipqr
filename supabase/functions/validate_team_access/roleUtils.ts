
/**
 * Get the higher priority role between team role and organization role
 */
export function getHigherRole(teamRole: string | null | undefined, orgRole: string | null | undefined): string | null {
  if (!teamRole && !orgRole) return null;
  if (!teamRole) return orgRole || null;
  if (!orgRole) return teamRole;
  
  const rolePriority: Record<string, number> = {
    'owner': 1,
    'manager': 2,
    'admin': 3,
    'creator': 4,
    'technician': 5,
    'viewer': 6
  };
  
  const teamRolePriority = rolePriority[teamRole] || 99;
  const orgRolePriority = rolePriority[orgRole] || 99;
  
  // Return the role with higher priority (lower number)
  return teamRolePriority <= orgRolePriority ? teamRole : orgRole;
}

/**
 * Determine the final access reason based on all factors
 */
export function determineAccessReason(
  initialReason: string | undefined,
  teamRole: string | null | undefined,
  orgRole: string | null | undefined,
  hasSameOrg: boolean,
  hasCrossOrg: boolean
): string {
  if (initialReason === 'error' || initialReason?.includes('error')) {
    return initialReason;
  }
  
  if (initialReason === 'team_member' && teamRole) {
    return hasCrossOrg ? 'cross_org_team_member' : 'team_member';
  }
  
  if (hasSameOrg && orgRole) {
    return `org_${orgRole}`;
  }
  
  if (hasSameOrg) {
    return 'same_org';
  }
  
  return initialReason || 'unknown';
}
