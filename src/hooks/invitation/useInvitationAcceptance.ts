
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { acceptInvitation as acceptTeamInvitation } from '@/services/team/invitation/acceptInvitation';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';
import { retry } from '@/utils/edgeFunctions/retry';
import { sanitizeToken } from '@/services/invitation/tokenUtils';

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const acceptInvitation = async (token: string, invitationType: 'team' | 'organization' = 'team') => {
    if (!token) {
      setError('No invitation token provided');
      return { success: false, error: 'No invitation token provided' };
    }

    // Sanitize and validate token format
    const sanitizedToken = sanitizeToken(token);
    if (!sanitizedToken) {
      setError('Invalid token format');
      return { success: false, error: 'Invalid token format' };
    }

    try {
      setIsAccepting(true);
      setError(null);
      setRateLimited(false);
      
      console.log(`Accepting ${invitationType} invitation with token: ${sanitizedToken.substring(0, 8)}...`);
      
      // Get current session to check if we're authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.user?.id) {
        throw new Error('Authentication required. Please sign in before accepting this invitation.');
      }
      
      // Process the invitation based on type
      if (invitationType === 'organization') {
        try {
          // Use retry with exponential backoff for organization invitations
          const result = await retry(
            async () => acceptOrganizationInvitation(sanitizedToken),
            2, // Max 2 retries
            1000, // Initial delay 1 second
            (error: any) => error?.message?.includes('429') || error?.status === 429 // Check for rate limits
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to accept organization invitation');
          }
          
          toast.success('Organization invitation accepted!', {
            description: `Welcome to ${result.organizationName || 'the organization'}`
          });
          
          return result;
        } catch (orgError: any) {
          // Check for rate limiting
          if (orgError.message?.includes('429') || orgError.status === 429) {
            console.warn('Rate limit detected when accepting organization invitation');
            setRateLimited(true);
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          }
          throw orgError;
        }
      } else {
        // Team invitation
        try {
          const result = await acceptTeamInvitation(sanitizedToken);
          
          toast.success('Team invitation accepted!', {
            description: `You have joined ${result.teamName || 'the team'}`
          });
          
          return {
            success: true,
            teamId: result.teamId,
            teamName: result.teamName,
            role: result.role
          };
        } catch (teamError: any) {
          // Check for rate limiting
          if (teamError.message?.includes('429') || teamError.status === 429) {
            console.warn('Rate limit detected when accepting team invitation');
            setRateLimited(true);
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          }
          throw teamError;
        }
      }
    } catch (error: any) {
      console.error(`Error accepting ${invitationType} invitation:`, error);
      setError(error.message || `Failed to accept ${invitationType} invitation`);
      
      return {
        success: false,
        error: error.message || `Failed to accept ${invitationType} invitation`
      };
    } finally {
      setIsAccepting(false);
    }
  };

  return {
    acceptInvitation,
    isAccepting,
    error,
    rateLimited
  };
}
