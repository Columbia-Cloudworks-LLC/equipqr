
import { useEffect, useState } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitationService';
import { detectInvitationType } from '@/services/invitation/tokenUtils';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitationValidation(token: string | undefined, initialType: string = 'team') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [invitationType, setInvitationType] = useState<'team' | 'organization'>(
    initialType === 'organization' ? 'organization' : 'team'
  );
  const [rateLimited, setRateLimited] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Reset state if token changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setInvitationDetails(null);
    setRateLimited(false);
    setAttempts(0);
  }, [token]);
  
  useEffect(() => {
    let isMounted = true;
    
    const validateToken = async () => {
      try {
        if (!token) {
          setError('No invitation token provided');
          setLoading(false);
          return;
        }
        
        if (isAuthLoading) {
          // Wait for auth to settle
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // First, try to detect invitation type if not explicitly provided
        if (attempts === 0 && initialType !== 'organization' && initialType !== 'team') {
          try {
            const detectedType = await detectInvitationType(token);
            if (detectedType) {
              console.log(`Auto-detected invitation type: ${detectedType}`);
              setInvitationType(detectedType);
            }
          } catch (detectError) {
            console.error('Error detecting invitation type:', detectError);
          }
        }
        
        // Now validate the invitation with the determined type
        if (invitationType === 'organization') {
          // Handle organization invitation
          const { valid, invitation, error, rateLimit } = await validateOrganizationInvitation(token);
          
          if (!isMounted) return;
          
          if (rateLimit) {
            setRateLimited(true);
          }
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        } else {
          // Handle team invitation
          const { valid, invitation, error, rateLimit } = await validateInvitationToken(token);
          
          if (!isMounted) return;
          
          if (rateLimit) {
            setRateLimited(true);
          }
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        }
        
        setAttempts(prev => prev + 1);
      } catch (error: any) {
        if (!isMounted) return;
        console.error('Error validating invitation:', error);
        setError(error.message || 'An error occurred validating the invitation');
        
        // Check for rate limiting errors
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
          setRateLimited(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only run if we have a token and auth has settled
    if (token && !isAuthLoading) {
      validateToken();
    }
    
    return () => {
      isMounted = false;
    };
  }, [token, invitationType, initialType, isAuthLoading, attempts]);
  
  const isValid = !loading && !error && !!invitationDetails;
  
  return {
    loading,
    isValidating: loading,
    error,
    invitationDetails,
    isValid,
    invitationType,
    rateLimited,
    user,
    isAuthLoading
  };
}
