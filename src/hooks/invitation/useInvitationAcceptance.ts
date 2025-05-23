
import { useState } from 'react';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';
import { acceptInvitation as acceptTeamInvitation } from '@/services/team/invitation/acceptInvitation';
import { toast } from 'sonner';

type InvitationType = 'team' | 'organization';

interface AcceptanceResult {
  success: boolean;
  error?: string;
  entityId?: string; 
  entityName?: string;
}

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AcceptanceResult | null>(null);
  
  /**
   * Accept an invitation based on its type (team or organization)
   */
  const acceptInvitation = async (token: string, type: InvitationType = 'team'): Promise<AcceptanceResult> => {
    if (!token) {
      const errorMsg = 'Invalid invitation token';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    try {
      setIsAccepting(true);
      setError(null);
      
      console.log(`Accepting ${type} invitation with token: ${token.substring(0, 8)}...`);
      
      let acceptanceResult: AcceptanceResult;
      
      // Call the appropriate acceptance function based on invitation type
      if (type === 'organization') {
        const orgResult = await acceptOrganizationInvitation(token);
        acceptanceResult = {
          success: orgResult.success,
          error: orgResult.error,
          entityId: orgResult.organizationId,
          entityName: orgResult.organizationName
        };
      } else {
        const teamResult = await acceptTeamInvitation(token);
        acceptanceResult = {
          success: !!teamResult?.teamId,
          error: teamResult instanceof Error ? teamResult.message : undefined,
          entityId: teamResult?.teamId,
          entityName: teamResult?.teamName
        };
      }
      
      // Store the result
      setResult(acceptanceResult);
      
      if (acceptanceResult.success) {
        const entityName = acceptanceResult.entityName || (type === 'organization' ? 'the organization' : 'the team');
        toast.success(`Successfully joined ${entityName}`);
      } else if (acceptanceResult.error) {
        setError(acceptanceResult.error);
        toast.error(`Failed to accept invitation: ${acceptanceResult.error}`);
      }
      
      return acceptanceResult;
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred';
      console.error(`Error accepting ${type} invitation:`, error);
      setError(errorMsg);
      toast.error(`Failed to accept invitation: ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setIsAccepting(false);
    }
  };
  
  return {
    acceptInvitation,
    isAccepting,
    error,
    result,
    clearError: () => setError(null)
  };
}
