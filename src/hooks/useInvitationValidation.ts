
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationToken } from '@/services/team/invitationService';
import { validateOrganizationInvitation } from '@/services/organization/invitationService';

export function useInvitationValidation(token: string, type?: string) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        setUser(data.session.user);
      } else {
        setError('Authentication required to validate invitation.');
      }
      
      setIsAuthLoading(false);
    };

    const validateInvitation = async () => {
      setIsValidating(true);
      setError(null);
      
      try {
        // Determine if this is an organization or team invitation
        const invitationType = type === 'organization' ? 'organization' : 'team';
        
        let result;
        if (invitationType === 'organization') {
          result = await validateOrganizationInvitation(token);
        } else {
          result = await validateInvitationToken(token);
        }

        if (result && result.valid) {
          setIsValid(true);
          setInvitation(result.invitation);
        } else {
          setIsValid(false);
          setError(result.error || 'Invalid invitation');
        }
      } catch (error: any) {
        console.error('Error validating invitation:', error);
        setIsValid(false);
        setError(error.message || 'Failed to validate invitation');
      } finally {
        setIsValidating(false);
      }
    };

    checkAuth();

    if (token) {
      validateInvitation();
    } else {
      setIsValidating(false);
      setIsValid(false);
      setError('No invitation token provided');
    }
  }, [token, type]);

  return {
    isValidating,
    isValid,
    error,
    invitation,
    user,
    isAuthLoading
  };
}
