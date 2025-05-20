
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTeamInvitation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = async (token: string) => {
    if (!token) {
      const errorMsg = 'No invitation token provided';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('Accepting team invitation with token:', token.substring(0, 8) + '...');
      
      // First validate the invitation
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate_invitation', {
        body: { token }
      });

      if (validationError) {
        throw new Error(validationError.message || 'Failed to validate invitation');
      }

      if (!validationData || validationData.error || !validationData.valid) {
        throw new Error(validationData?.error || 'Invalid or expired invitation');
      }

      // Now accept the invitation
      const { data, error: acceptError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('token', token)
        .eq('status', 'pending')
        .select('id, team_id, role')
        .single();

      if (acceptError) {
        throw new Error(acceptError.message || 'Failed to accept invitation');
      }

      if (!data) {
        throw new Error('No invitation found with this token');
      }

      // Create team membership
      await addUserToTeam(data.team_id, data.role);

      toast.success('Team invitation accepted successfully!');
      
      return { success: true, teamId: data.team_id };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to accept team invitation';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to add the current user to the team
  const addUserToTeam = async (teamId: string, role: string) => {
    try {
      // Get the current user's auth ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.user?.id) {
        throw new Error('Authentication required');
      }
      
      const userId = sessionData.session.user.id;
      
      // Use the edge function to add the user to the team
      const { data, error } = await supabase.functions.invoke('add_team_member', {
        body: { 
          team_id: teamId, 
          user_id: userId,
          role
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to add user to team');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error adding user to team:', error);
      throw error;
    }
  };

  return {
    acceptInvitation,
    isProcessing,
    error
  };
}
