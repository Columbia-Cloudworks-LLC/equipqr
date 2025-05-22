
import { useCallback } from 'react';
import { getTeamAccessDetails } from '@/services/team/validation';

/**
 * Hook to handle team membership checks
 */
export function useTeamMembershipCheck(
  teamId: string | null,
  currentUserId: string | null,
  retryCount: number,
  setIsCheckingAccess: (value: boolean) => void,
  setError: (error: string | null) => void,
  setIsMember: (value: boolean) => void,
  setAccessRole: (value: string | null) => void,
  setAccessReason: (value: string | null) => void,
  setHasCrossOrgAccess: (value: boolean) => void,
  setTeamOrgName: (value: string | null) => void,
  setTeamDetails: (value: any) => void,
  setHasOrgAccess: (value: boolean) => void,
  setOrganizationRole: (value: string | null) => void,
  setCheckAttempts: (value: number | ((prev: number) => number)) => void,
  setRetryTimeout: (value: number | null) => void
) {
  const checkDetailedTeamAccess = useCallback(async (teamId: string) => {
    if (!currentUserId) return;
    
    try {
      setIsCheckingAccess(true);
      // Clear previous state
      setError(null);
      
      console.log(`Checking detailed team access for team ${teamId}, checking user ${currentUserId}`);
      
      // Use the enhanced team access details function with improved logic for org roles
      const accessDetails = await getTeamAccessDetails(teamId, currentUserId);
      
      console.log('Team access details result:', accessDetails);
      
      // Use the hasAccess flag directly - it now considers both direct membership and org role access
      const hasAccess = accessDetails.hasAccess || false;
      
      // Track if user has org-level access and their org role
      setHasOrgAccess(accessDetails.hasOrgAccess || false);
      setOrganizationRole(accessDetails.orgRole || null);
      
      // Set member status based on direct membership or org access
      setIsMember(hasAccess);
      
      // Only set access role if it's not null to prevent overriding with null
      if (accessDetails.role !== null) {
        setAccessRole(accessDetails.role);
      }
      
      // Set additional context for debugging
      setAccessReason(accessDetails.accessReason);
      setHasCrossOrgAccess(accessDetails.hasCrossOrgAccess || false);
      setTeamOrgName(accessDetails.orgName);
      setTeamDetails(accessDetails.team);
      
      // Reset check attempts on success
      setCheckAttempts(0);
      
      // Only show errors if there's no access
      if (!hasAccess) {
        // Enhanced error message for cross-organization scenario
        if (accessDetails.teamOrgId && accessDetails.userOrgId && accessDetails.teamOrgId !== accessDetails.userOrgId) {
          setError(`You don't have sufficient permissions to access this team in organization "${accessDetails.orgName || 'Unknown'}". This team belongs to a different organization than your primary one.`);
        } else {
          setError('You are not a member of this team and have no organization-level access.');
        }
      } else {
        setError(null);
      }
      
    } catch (error: any) {
      console.error('Error checking team access:', error);
      
      // Implement retry logic for network issues up to 3 attempts
      setCheckAttempts((prevAttempts) => {
        const newAttemptCount = prevAttempts + 1;
        
        if (newAttemptCount < 3) {
          console.log(`Retrying team access check in ${newAttemptCount * 1000}ms (attempt ${newAttemptCount + 1})`);
          const timeout = setTimeout(() => {
            checkDetailedTeamAccess(teamId);
          }, newAttemptCount * 1000); // Exponential backoff
          
          setRetryTimeout(timeout as unknown as number);
        } else {
          // After 3 failures, show error
          setError('Failed to verify team membership. Please try again.');
          // On error, assume no membership to show the repair option
          setIsMember(false);
        }
        
        return newAttemptCount;
      });
    } finally {
      setIsCheckingAccess(false);
    }
  }, [currentUserId, setIsCheckingAccess, setError, setIsMember, setAccessRole, 
      setAccessReason, setHasCrossOrgAccess, setTeamOrgName, setTeamDetails,
      setHasOrgAccess, setOrganizationRole, setCheckAttempts, setRetryTimeout]);

  return { checkDetailedTeamAccess };
}
