
import { useCallback } from 'react';
import { getTeamAccessDetails } from '@/services/team/validation/teamAccessValidation';

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
    if (!currentUserId) {
      console.warn('No current user ID available for team access check');
      return;
    }
    
    try {
      setIsCheckingAccess(true);
      setError(null);
      
      console.log(`Checking detailed team access for team ${teamId}, user ${currentUserId}`);
      
      // Use the local validation service instead of edge function
      const accessDetails = await getTeamAccessDetails(teamId, currentUserId);
      
      console.log('Team access details result:', accessDetails);
      
      // Update all state based on access details
      const hasAccess = accessDetails.hasAccess || false;
      
      setHasOrgAccess(accessDetails.hasOrgAccess || false);
      setOrganizationRole(accessDetails.orgRole || null);
      setIsMember(hasAccess);
      
      if (accessDetails.role !== null) {
        setAccessRole(accessDetails.role);
      }
      
      setAccessReason(accessDetails.accessReason);
      setHasCrossOrgAccess(accessDetails.hasCrossOrgAccess || false);
      setTeamOrgName(accessDetails.orgName);
      setTeamDetails(accessDetails.team);
      
      // Reset check attempts on success
      setCheckAttempts(0);
      
      // Only show errors if there's no access
      if (!hasAccess) {
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
          if (error.message?.includes('not found') || error.message?.includes('deleted')) {
            setError('This team has been deleted or no longer exists. Please select another team.');
          } else {
            setError('Failed to verify team membership. Please try again.');
          }
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
