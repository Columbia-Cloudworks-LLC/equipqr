
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctionUtils';
import { useAuth } from '@/contexts/AuthContext';

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

  const acceptInvitation = async (token: string, type?: string): Promise<any> => {
    setIsAccepting(true);
    setAcceptError(null);
    let result = null;

    try {
      // Verify we have a valid session before proceeding
      const isValidSession = await checkSession();
      if (!isValidSession) {
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
        // Check session again right before the edge function call
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          console.error('No authenticated session found before edge function call');
          throw new Error('Authentication required. Please login and try again.');
        }
        
        console.log('Calling accept_organization_invitation edge function with valid session');
        
        // Use the edge function utility with retry logic and longer timeout
        const acceptData = await invokeEdgeFunctionWithRetry('accept_organization_invitation', {
          token
        }, { 
          maxRetries: 3, 
          timeoutMs: 12000,
          // Explicitly log each attempt for debugging
          onRetry: (attempt, error) => {
            console.warn(`Retry attempt ${attempt} for accept_organization_invitation:`, error);
          }
        });
        
        console.log('Edge function response:', acceptData);
        
        if (!acceptData || !acceptData.success) {
          throw new Error(acceptData?.error || 'Failed to accept organization invitation');
        }
        
        result = acceptData;
        
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
        const acceptData = await invokeEdgeFunctionWithRetry('accept_team_invitation', {
          token
        }, { 
          maxRetries: 3, 
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
    }
  };

  return {
    acceptInvitation,
    isAccepting,
    acceptError
  };
}

export default useInvitationAcceptance;
