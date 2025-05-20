
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invokeEdgeFunctionWithRetry } from '@/utils/edgeFunctionUtils';

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();

  const acceptInvitation = async (token: string, type?: string): Promise<any> => {
    setIsAccepting(true);
    setAcceptError(null);
    let result = null;

    try {
      console.log(`Accepting invitation with token: ${token.substring(0, 8)}... (Type: ${type || 'team'})`);
      
      if (type === 'organization') {
        // Get the current session for auth headers
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          throw new Error('No authenticated session found');
        }
        
        // Use the edge function utility with retry logic for more reliability
        const acceptData = await invokeEdgeFunctionWithRetry('accept_organization_invitation', {
          token
        }, { 
          maxRetries: 2, 
          timeoutMs: 8000,
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
        
        // Force refresh organizations in context
        console.log('Refreshing organizations after accepting org invitation');
        await refreshOrganizations();
        
        toast.success('Successfully joined the organization');
        
        // Redirect to organization settings
        navigate('/organization');
      } else {
        // Default to team invitation - also use the retry utility
        const acceptData = await invokeEdgeFunctionWithRetry('accept_team_invitation', {
          token
        }, { 
          maxRetries: 2, 
          timeoutMs: 8000,
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
        await refreshOrganizations();
        
        toast.success('Successfully joined the team');
        navigate('/teams');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setAcceptError(error.message || 'Failed to accept invitation');
      toast.error(`Failed to accept invitation: ${error.message}`);
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
