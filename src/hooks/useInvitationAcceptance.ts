
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctionUtils';
import { useAuth } from '@/contexts/AuthContext';
import { acceptOrganizationInvitation } from '@/services/organization/invitation/invitationAcceptance';

// Track invitations being processed to prevent duplicate attempts
const processingInvitations: Record<string, boolean> = {};

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();
  const { session, checkSession } = useAuth();

  // Ensure we have valid session before proceeding
  useEffect(() => {
    const validateSession = async () => {
      await checkSession();
    };
    
    validateSession();
  }, [checkSession]);

  // Wait for session to be valid before accepting invitations
  const ensureValidSession = async (): Promise<boolean> => {
    // Check if we already have a valid session
    if (session?.user) {
      return true;
    }
    
    // Otherwise, explicitly check session status
    console.log("Ensuring valid session before proceeding with invitation acceptance");
    const isValid = await checkSession();
    
    if (!isValid) {
      console.error("No valid session available for invitation acceptance");
      throw new Error('Authentication required. Please login and try again.');
    }
    
    // Double check we have a session now
    const { data: sessionData } = await supabase.auth.getSession();
    return !!sessionData?.session;
  };

  const acceptInvitation = async (token: string, type?: string): Promise<any> => {
    // Prevent duplicate processing of the same invitation
    if (processingInvitations[token]) {
      console.log(`Invitation ${token.substring(0, 8)}... is already being processed, skipping`);
      return null;
    }
    
    try {
      // Mark as processing
      processingInvitations[token] = true;
      setIsAccepting(true);
      setAcceptError(null);
      let result = null;

      // Verify we have a valid session before proceeding
      const hasSession = await ensureValidSession();
      if (!hasSession) {
        throw new Error('No authenticated session found. Please login and try again.');
      }

      // Log the invitation type and token for debugging
      console.log(`Accepting invitation with token: ${token.substring(0, 8)}... (Type: ${type || 'team'})`);
      console.log('Current auth state:', { 
        hasSession: !!session,
        email: session?.user?.email, 
        authTime: session?.user?.last_sign_in_at
      });
      
      // Normalize invitation type to ensure consistent handling
      const invitationType = type === 'organization' ? 'organization' : 'team';
      
      if (invitationType === 'organization') {
        // For organization invitations, use our dedicated service function
        const acceptResult = await acceptOrganizationInvitation(token);
        
        if (!acceptResult.success) {
          throw new Error(acceptResult.error || 'Failed to accept organization invitation');
        }
        
        result = acceptResult;
        
        // Force refresh organizations in context with delay to ensure DB changes are available
        console.log('Refreshing organizations after accepting org invitation');
        setTimeout(async () => {
          try {
            await refreshOrganizations();
            console.log('Organizations refreshed successfully');
          } catch (refreshError) {
            console.error('Error refreshing organizations:', refreshError);
          }
        }, 1000);
        
        toast.success('Successfully joined the organization');
        
        // Redirect to organization settings
        navigate('/organization');
      } else {
        // Team invitation logic - also use the retry utility
        console.log('Calling accept_team_invitation edge function for team invitation');
        const acceptData: {
          success: boolean;
          error?: string;
        } = await invokeEdgeFunctionWithRetry('accept_team_invitation', {
          token
        }, { 
          maxRetries: 2, 
          timeoutMs: 10000,
          onRetry: (attempt, error) => {
            console.warn(`Retry attempt ${attempt} for accept_team_invitation:`, error);
          }
        });
        
        console.log('Team invitation acceptance response:', acceptData);
        
        if (!acceptData || !acceptData.success) {
          throw new Error(acceptData?.error || 'Failed to accept team invitation');
        }
        
        result = acceptData;
        
        // Also refresh organizations since team membership can affect org access
        console.log('Refreshing organizations after accepting team invitation');
        setTimeout(async () => {
          try {
            await refreshOrganizations();
            console.log('Organizations refreshed successfully after team invitation');
          } catch (refreshError) {
            console.error('Error refreshing organizations:', refreshError);
          }
        }, 1000);
        
        toast.success('Successfully joined the team');
        navigate('/teams');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error.message || 'Failed to accept invitation';
      setAcceptError(errorMessage);
      toast.error(`Failed to accept invitation: ${errorMessage}`);
      return null;
    } finally {
      setIsAccepting(false);
      
      // Clear processing state after a delay to prevent immediate retries
      setTimeout(() => {
        delete processingInvitations[token];
      }, 5000);
    }
  };

  return {
    acceptInvitation,
    isAccepting,
    acceptError
  };
}

export default useInvitationAcceptance;
