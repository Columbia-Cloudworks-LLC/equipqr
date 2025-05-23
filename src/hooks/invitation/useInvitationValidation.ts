
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

/**
 * Attempts to detect the invitation type by the token format or length
 * This is a fallback when the type isn't explicitly specified
 */
const detectInvitationType = (token: string): 'team' | 'organization' => {
  // Add specific detection logic if needed
  // For now, we'll use a simple approach, assuming organization tokens might have different patterns
  // This should be enhanced with actual token pattern detection if there are reliable patterns
  return 'team'; // Default to team if we can't detect
};

export function useInvitationValidation(token: string | undefined, invitationType: string = 'team') {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [detectedType, setDetectedType] = useState<'team' | 'organization'>(
    invitationType === 'organization' ? 'organization' : 'team'
  );
  const [attemptedValidations, setAttemptedValidations] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Normalize and store the invitation type from props
    const normalizedType = invitationType === 'organization' ? 'organization' : 'team';
    setDetectedType(normalizedType);
    
    console.log(`useInvitationValidation: Using invitation type: ${normalizedType} (provided: ${invitationType})`);
  }, [invitationType]);
  
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

        console.log(`Validating invitation with token: ${token.substring(0, 8)}... as type: ${detectedType}`);
        
        // Record that we've attempted validation with this type
        setAttemptedValidations(prev => ({ ...prev, [detectedType]: true }));
        
        try {
          let validationResult;
          
          if (detectedType === 'organization') {
            // Handle organization invitation
            validationResult = await debouncedValidateOrg(token);
          } else {
            // Handle team invitation
            validationResult = await debouncedValidateTeam(token);
          }
          
          const { valid, invitation, error } = validationResult;
          
          if (!valid) {
            // If validation fails and we haven't tried the other type yet,
            // let's try the alternate type as a fallback
            if (!attemptedValidations[detectedType === 'team' ? 'organization' : 'team']) {
              const alternateType = detectedType === 'team' ? 'organization' : 'team';
              console.log(`First validation attempt failed. Trying alternate type: ${alternateType}`);
              
              setDetectedType(alternateType);
              return; // Exit and let the useEffect run again with the new type
            }
            
            setError(error || 'Invalid invitation');
          } else {
            setInvitation(invitation);
            setIsValid(true);
          }
        } catch (error: any) {
          console.error('Error validating invitation:', error);
          
          // Check if this is a rate limit error
          if (error.message?.includes('429') || error.status === 429 || 
              error.message?.toLowerCase().includes('rate limit')) {
            setRateLimited(true);
            setError('Too many requests. Please try again in a moment.');
          } else if (error.status === 406) {
            // 406 Not Acceptable often means we're using the wrong endpoint
            console.warn('Received 406 error - might be using wrong invitation type');
            
            // Try the other invitation type if we haven't already
            if (!attemptedValidations[detectedType === 'team' ? 'organization' : 'team']) {
              const alternateType = detectedType === 'team' ? 'organization' : 'team';
              console.log(`Received 406 error. Trying alternate type: ${alternateType}`);
              
              setDetectedType(alternateType);
              return; // Exit and let the useEffect run again with the new type
            }
            
            setError('Invalid invitation format');
          } else {
            setError(error.message || 'An error occurred validating the invitation');
          }
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, detectedType, attemptedValidations]);
  
  return {
    isValidating,
    isValid,
    error,
    invitation,
    isAuthLoading,
    user,
    rateLimited,
    invitationType: detectedType
  };
}
