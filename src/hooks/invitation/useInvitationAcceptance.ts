
import { useState, useCallback } from 'react';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';
import { acceptInvitation as acceptTeamInvitation } from '@/services/team/invitation/acceptInvitation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { retry, debounce, withCache } from '@/utils/edgeFunctions/retry';

export type InvitationType = 'team' | 'organization';

export interface AcceptanceResult {
  success: boolean;
  error?: string;
  entityId?: string; 
  entityName?: string;
}

// Create a debounced version of the edge function call
const debouncedEdgeFunction = debounce(async (functionName: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload
  });
  
  if (error) throw new Error(error.message || 'Edge function error');
  return data;
}, 800);

// Create a cached version of token validation
const cachedValidateToken = withCache(
  async (token: string, type: string) => {
    const functionName = type === 'organization' 
      ? 'validate_org_invitation' 
      : 'validate_invitation';
      
    return debouncedEdgeFunction(functionName, { token });
  },
  (token, type) => `${type}_validation_${token}`,
  60000 // 1 minute TTL
);

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AcceptanceResult | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  
  /**
   * Validate invitation token format
   */
  const validateTokenFormat = (token: string): boolean => {
    // Check if token is a string with reasonable length (at least 10 chars)
    if (typeof token !== 'string' || token.length < 10) {
      console.error(`Invalid token format: type=${typeof token}, length=${token?.length}`);
      return false;
    }
    return true;
  };
  
  /**
   * Call edge function with retries and rate limit handling
   */
  const callEdgeFunctionWithRetry = async (functionName: string, payload: any) => {
    try {
      setRateLimited(false);
      
      return await retry(
        async () => debouncedEdgeFunction(functionName, payload),
        3, // Number of retries
        1000, // Initial delay in ms
        (error) => {
          const isRateLimit = error?.message?.includes('429') || error?.status === 429;
          if (isRateLimit) setRateLimited(true);
          return isRateLimit;
        }
      );
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 429) {
        setRateLimited(true);
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      throw error;
    }
  };

  /**
   * Accept an invitation based on its type (team or organization)
   */
  const acceptInvitation = async (token: string, type: InvitationType = 'team'): Promise<AcceptanceResult> => {
    if (!token) {
      const errorMsg = 'Invalid invitation token';
      console.error(errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Validate token format
    if (!validateTokenFormat(token)) {
      const errorMsg = 'Invalid invitation token format';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    try {
      setIsAccepting(true);
      setError(null);
      
      console.log(`Accepting ${type} invitation with token: ${token.substring(0, 8)}... (length: ${token.length})`);
      
      let acceptanceResult: AcceptanceResult;
      
      // Call the appropriate acceptance function based on invitation type
      if (type === 'organization') {
        try {
          console.log('Calling accept_organization_invitation edge function');
          
          // Try using the edge function with retry logic
          const data = await callEdgeFunctionWithRetry('accept_organization_invitation', { token });
          
          console.log('Edge function response:', data);
          
          acceptanceResult = {
            success: data.success,
            error: data.error,
            entityId: data.data?.organization?.id,
            entityName: data.data?.organization?.name
          };
        } catch (edgeFunctionError: any) {
          console.warn('Edge function failed, falling back to direct function:', edgeFunctionError);
          
          if (rateLimited) {
            return { 
              success: false, 
              error: 'You have made too many requests. Please wait a moment and try again.' 
            };
          }
          
          // Fall back to the direct function
          const orgResult = await acceptOrganizationInvitation(token);
          console.log('Direct function result:', orgResult);
          
          acceptanceResult = {
            success: orgResult.success,
            error: orgResult.error,
            entityId: orgResult.organizationId,
            entityName: orgResult.organizationName
          };
        }
      } else {
        // Team invitations
        try {
          console.log('Processing team invitation');
          const teamResult = await acceptTeamInvitation(token);
          console.log('Team invitation result:', teamResult);
          
          acceptanceResult = {
            success: !!teamResult?.teamId,
            error: teamResult instanceof Error ? teamResult.message : undefined,
            entityId: teamResult?.teamId,
            entityName: teamResult?.teamName
          };
        } catch (teamError: any) {
          // Check if this was a rate limit error
          if (teamError?.message?.includes('429') || teamError?.status === 429) {
            setRateLimited(true);
            return { 
              success: false, 
              error: 'You have made too many requests. Please wait a moment and try again.' 
            };
          }
          
          console.error('Error accepting team invitation:', teamError);
          return { 
            success: false, 
            error: teamError.message || 'Failed to process team invitation' 
          };
        }
      }
      
      // Store the result
      setResult(acceptanceResult);
      
      if (acceptanceResult.success) {
        const entityName = acceptanceResult.entityName || (type === 'organization' ? 'the organization' : 'the team');
        console.log(`Successfully joined ${entityName}`);
        toast.success(`Successfully joined ${entityName}`);
      } else if (acceptanceResult.error) {
        console.error(`Failed to accept ${type} invitation:`, acceptanceResult.error);
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
    rateLimited,
    clearError: () => setError(null)
  };
}
