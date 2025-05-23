
import { useEffect, useState } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitation/invitationValidation';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/utils/edgeFunctions/retry';
import { detectInvitationType, sanitizeToken } from '@/services/invitation/tokenUtils';
import { toast } from 'sonner';

export function useInvitationValidation(token: string | undefined, invitationType: string = 'team') {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [detectedType, setDetectedType] = useState<'team' | 'organization'>(
    invitationType === 'organization' ? 'organization' : 'team'
  );
  const [attemptedValidations, setAttemptedValidations] = useState<Record<string, boolean>>({});
  const [validationAttempts, setValidationAttempts] = useState(0);
  const { user, isLoading: isAuthLoading, session, checkSession } = useAuth();

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log('Invitation validation state:', {
      token: token ? `${token.substring(0, 8)}...` : 'none',
      detectedType,
      isValidating,
      isAuthLoading,
      user: user ? 'authenticated' : 'unauthenticated',
      hasSession: !!session,
      validationAttempts
    });
  }, [token, detectedType, isValidating, isAuthLoading, user, session, validationAttempts]);

  // Force session check when component loads
  useEffect(() => {
    const verifySession = async () => {
      if (!isAuthLoading && token) {
        console.log('Explicitly checking session validity before validation');
        const isValid = await checkSession();
        console.log('Session check result:', isValid ? 'valid' : 'invalid');
      }
    };
    
    verifySession();
  }, [token, isAuthLoading, checkSession]);

  // Reset state when token changes
  useEffect(() => {
    if (token) {
      console.log(`Resetting validation state for token: ${token.substring(0, 8)}...`);
      setIsValidating(true);
      setError(null);
      setInvitation(null);
      setRateLimited(false);
      setAttemptedValidations({});
      setValidationAttempts(0);
      
      // Set initial type based on URL parameter
      setDetectedType(invitationType === 'organization' ? 'organization' : 'team');
    }
  }, [token, invitationType]);

  // Main validation effect
  useEffect(() => {
    if (!token || isAuthLoading) return;
    
    // Don't try to validate if we've already tried too many times
    if (validationAttempts > 3) {
      console.warn('Too many validation attempts, giving up');
      if (!error) setError('Unable to validate invitation after multiple attempts');
      setIsValidating(false);
      return;
    }

    // Check if we've already attempted this type
    if (attemptedValidations[detectedType]) {
      console.log(`Already attempted ${detectedType} validation`);
      return;
    }
    
    const validateInvitation = async () => {
      try {
        setIsValidating(true);
        
        // Sanitize token
        const sanitizedToken = sanitizeToken(token);
        if (!sanitizedToken) {
          setError('Invalid invitation format');
          setIsValidating(false);
          return;
        }
        
        // Log authentication state before validation
        console.log('Auth state before validation:', {
          hasUser: !!user,
          userId: user?.id,
          tokenPresent: !!session?.access_token,
          expiresAt: session?.expires_at ? new Date(session?.expires_at * 1000).toISOString() : 'unknown'
        });
        
        console.log(`Validating ${detectedType} invitation with token: ${sanitizedToken.substring(0, 8)}...`);
        
        // Record that we're attempting this validation type
        setAttemptedValidations(prev => ({...prev, [detectedType]: true}));
        setValidationAttempts(prev => prev + 1);
        
        let result;
        if (detectedType === 'organization') {
          result = await validateOrganizationInvitation(sanitizedToken);
        } else {
          result = await validateInvitationToken(sanitizedToken);
        }
        
        console.log(`${detectedType} validation result:`, result);
        
        if (result.valid && result.invitation) {
          setIsValid(true);
          setInvitation(result.invitation);
          setError(null);
          console.log('Invitation validated successfully:', result.invitation);
        } else if (result.rateLimit) {
          console.warn('Rate limit detected during validation');
          setRateLimited(true);
          setError('Too many requests. Please try again in a moment.');
          
          // Show rate limit toast
          toast.warning('Rate limit reached', {
            description: 'Please wait a moment before trying again'
          });
        } else {
          console.warn('Invitation validation failed:', result.error);
          setError(result.error || 'Invalid invitation');
          
          // If first validation fails, try to detect the type and try again with the other type
          if (validationAttempts === 0) {
            try {
              console.log('First validation failed, attempting to auto-detect invitation type');
              const detectedInvType = await detectInvitationType(sanitizedToken);
              
              if (detectedInvType && detectedInvType !== detectedType) {
                console.log(`Auto-detected different invitation type: ${detectedInvType}, retrying validation`);
                setDetectedType(detectedInvType);
                return; // Exit and let the useEffect run again with the new type
              }
            } catch (err) {
              console.error('Error detecting invitation type:', err);
            }
          }
          
          // If we've tried both types and still failed, show a final error
          if (attemptedValidations['team'] && attemptedValidations['organization']) {
            console.error('Validation failed for both invitation types');
            setError('Invalid or expired invitation. Please request a new invitation.');
          }
        }
      } catch (err: any) {
        console.error('Error during validation:', err);
        
        // Check for rate limiting
        if (err.message?.includes('429') || err.status === 429 || 
            err.message?.toLowerCase().includes('rate limit')) {
          setRateLimited(true);
          setError('Too many requests. Please try again in a moment.');
          toast.warning('Rate limit reached', {
            description: 'Please wait a moment before trying again'
          });
        } else {
          setError(err.message || 'An error occurred validating the invitation');
        }
      } finally {
        setIsValidating(false);
      }
    };

    // Use a small timeout to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      validateInvitation();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [token, detectedType, isAuthLoading, user, session, attemptedValidations, validationAttempts, checkSession]);
  
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
