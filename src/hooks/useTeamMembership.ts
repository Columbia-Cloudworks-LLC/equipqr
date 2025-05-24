
import { useTeamMembershipCore } from './team-membership';

/**
 * Hook for handling team membership operations
 * This is now a thin wrapper around the core implementation for backward compatibility
 */
export function useTeamMembership(teamId: string | null) {
  const membership = useTeamMembershipCore(teamId);
  
  return {
    // Member status
    isMember: membership.isMember,
    isCheckingAccess: membership.isCheckingAccess,
    
    // User info
    currentUserId: membership.currentUserId,
    
    // Error handling
    error: membership.error,
    
    // Access details
    accessReason: membership.accessReason,
    accessRole: membership.accessRole,
    hasCrossOrgAccess: membership.hasCrossOrgAccess,
    hasOrgAccess: membership.hasOrgAccess,
    organizationRole: membership.organizationRole,
    teamOrgName: membership.teamOrgName,
    teamDetails: membership.teamDetails,
    
    // Functions
    checkTeamMembership: membership.checkTeamMembership,
    retryAccessCheck: membership.retryAccessCheck
  };
}
