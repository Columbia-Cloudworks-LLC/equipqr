
import { useEffect, useState } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitation/invitationValidation';
import { useAuth } from '@/contexts/AuthContext';
import { debounce, withCache } from '@/utils/edgeFunctions/retry';
import { detectInvitationType, sanitizeToken } from '@/services/invitation/tokenUtils';

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
  const [detectedType, setDetectedType] = useState<'team' | 'organization'>(
    invitationType === 'organization' ? 'organization' : 'team'
  );
  const [attemptedValidations, setAttemptedValidations] = useState<Record<string, boolean>>({});
  const [autoDetecting, setAutoDetecting] = useState(false);
  
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
        
        // Sanitize and validate token format
        const sanitizedToken = sanitizeToken(token);
        if (!sanitizedToken) {
          setError('Invalid invitation token format');
          return;
        }

        console.log(`Validating invitation with token: ${sanitizedToken.substring(0, 8)}... as type: ${detectedType}`);
        
        // Record that we've attempted validation with this type
        setAttemptedValidations(prev => ({ ...prev, [detectedType]: true }));
        
        // If we're not sure about the type, try to auto-detect it
        if (!autoDetecting && !attemptedValidations['auto-detected']) {
          setAutoDetecting(true);
          
          try {
            const detectedInvType = await detectInvitationType(sanitizedToken);
            
            if (detectedInvType) {
              console.log(`Auto-detected invitation type: ${detectedInvType}`);
              setAttemptedValidations(prev => ({ ...prev, 'auto-detected': true }));
              
              // Only switch if the detected type is different
              if (detectedInvType !== detectedType) {
                setDetectedType(detectedInvType);
                setAutoDetecting(false);
                return; // Exit and let the useEffect run again with the new type
              }
            }
          } catch (detectionError) {
            console.error('Error auto-detecting invitation type:', detectionError);
          }
          
          setAutoDetecting(false);
        }
        
        try {
          let validationResult;
          
          if (detectedType === 'organization') {
            // Handle organization invitation
            validationResult = await debouncedValidateOrg(sanitizedToken);
          } else {
            // Handle team invitation
            validationResult = await debouncedValidateTeam(sanitizedToken);
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
  }, [token, detectedType, attemptedValidations, autoDetecting]);
  
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
