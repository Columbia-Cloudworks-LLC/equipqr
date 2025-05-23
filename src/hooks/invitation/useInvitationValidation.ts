
import { useEffect, useState } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitation/invitationValidation';
import { useAuth } from '@/contexts/AuthContext';
import { debounce, withCache } from '@/utils/edgeFunctions/retry';

// Create cached validation functions to prevent excessive API calls
const cachedValidateTeamInvitation = withCache(
  validateInvitationToken,
  (token) => `team_invitation_${token}`,
  60000 // Cache for 1 minute
);

const cachedValidateOrgInvitation = withCache(
  validateOrganizationInvitation,
  (token) => `org_invitation_${token}`,
  60000 // Cache for 1 minute
);

// Create debounced validation functions to prevent rate limiting
const debouncedValidateTeam = debounce(async (token: string) => {
  return await cachedValidateTeamInvitation(token);
}, 800);

const debouncedValidateOrg = debounce(async (token: string) => {
  return await cachedValidateOrgInvitation(token);
}, 800);

export function useInvitationValidation(token: string | undefined, invitationType: string = 'team') {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true);
        setError(null);
        setRateLimited(false);
        
        if (!token) {
          setError('No invitation token provided');
          return;
        }
        
        try {
          if (invitationType === 'organization') {
            // Handle organization invitation
            const { valid, invitation, error } = await debouncedValidateOrg(token);
            
            if (!valid) {
              setError(error || 'Invalid invitation');
            } else {
              setInvitation(invitation);
              setIsValid(true);
            }
          } else {
            // Handle team invitation
            const { valid, invitation, error } = await debouncedValidateTeam(token);
            
            if (!valid) {
              setError(error || 'Invalid invitation');
            } else {
              setInvitation(invitation);
              setIsValid(true);
            }
          }
        } catch (error: any) {
          console.error('Error validating invitation:', error);
          
          // Check if this is a rate limit error
          if (error.message?.includes('429') || error.status === 429 || 
              error.message?.toLowerCase().includes('rate limit')) {
            setRateLimited(true);
            setError('Too many requests. Please try again in a moment.');
          } else {
            setError(error.message || 'An error occurred validating the invitation');
          }
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, invitationType]);
  
  return {
    isValidating,
    isValid,
    error,
    invitation,
    isAuthLoading,
    user,
    rateLimited
  };
}
