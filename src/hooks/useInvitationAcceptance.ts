
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();

  const acceptInvitation = async (token: string, type?: string): Promise<any> => {
    setIsAccepting(true);
    setAcceptError(null);

    try {
      let result;
      
      if (type === 'organization') {
        // Call the accept_organization_invitation edge function
        const { data: acceptData, error } = await supabase.functions.invoke('accept_organization_invitation', {
          body: { token }
        });
        
        if (error) throw new Error(error.message);
        result = acceptData;
        
        // Refresh organizations in context
        await refreshOrganizations();
        
        toast.success('Successfully accepted the organization invitation');
        navigate('/organization');
      } else {
        // Default to team invitation
        const { data: acceptData, error } = await supabase.functions.invoke('accept_team_invitation', {
          body: { token }
        });
        
        if (error) throw new Error(error.message);
        result = acceptData;
        
        toast.success('Successfully accepted the team invitation');
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
