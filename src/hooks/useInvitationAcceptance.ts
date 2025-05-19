
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AcceptanceData {
  token: string;
  type: 'team' | 'organization';
}

export function useInvitationAcceptance() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const navigate = useNavigate();

  const acceptInvitation = async (data: AcceptanceData, invitationDetails?: any) => {
    setIsAccepting(true);
    setAcceptError(null);

    try {
      let result;
      
      if (data.type === 'team') {
        const { data: acceptData, error } = await supabase.functions.invoke('accept_team_invitation', {
          body: { token: data.token }
        });
        
        if (error) throw new Error(error.message);
        result = acceptData;
      } else {
        const { data: acceptData, error } = await supabase.functions.invoke('accept_organization_invitation', {
          body: { token: data.token }
        });
        
        if (error) throw new Error(error.message);
        result = acceptData;
      }

      toast.success(`Successfully accepted the ${data.type} invitation`);
      
      // Navigate based on invitation type
      if (data.type === 'team') {
        navigate('/teams');
      } else {
        navigate('/organization');
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
