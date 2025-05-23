
import { useState, useEffect } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitation';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitationValidation(token: string) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true);
        if (!token) {
          setError("Invalid invitation token");
          setIsValid(false);
          return;
        }
        
        console.log(`Validating invitation token: ${token.substring(0, 8)}...`);
        
        // Try team invitation first
        const teamResult = await validateInvitationToken(token);
        if (teamResult.valid) {
          console.log("Valid team invitation found:", teamResult.invitation);
          setInvitation(teamResult.invitation);
          setIsValid(true);
          return;
        }
        
        // If not a team invitation, try organization invitation
        const orgResult = await validateOrganizationInvitation(token);
        if (orgResult.valid) {
          console.log("Valid organization invitation found:", orgResult.invitation);
          setInvitation(orgResult.invitation);
          setIsValid(true);
          return;
        }
        
        // No valid invitation found
        console.error("No valid invitation found");
        setError(teamResult.error || orgResult.error || "Invalid invitation");
        setIsValid(false);
      } catch (error: any) {
        console.error("Error validating invitation:", error);
        setError(error.message || "An error occurred while validating the invitation");
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Update auth loading state when auth context loading changes
  useEffect(() => {
    setIsAuthLoading(isLoading);
  }, [isLoading]);

  return {
    isValidating,
    isValid,
    error,
    invitation,
    isAuthLoading,
    user
  };
}
