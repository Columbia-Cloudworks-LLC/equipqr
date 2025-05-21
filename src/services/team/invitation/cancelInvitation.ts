
import { supabase } from '@/integrations/supabase/client';

export async function cancelInvitation(invitationId: string): Promise<void> {
  if (!invitationId) {
    throw new Error('Invitation ID is required');
  }
  
  try {
    // First get the invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('id, team_id')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to find invitation: ${fetchError.message}`);
    }
    
    if (!invitation) {
      throw new Error('Invitation not found or already accepted/cancelled');
    }
    
    // Check if user has permission to manage invites for this team
    const { data: checkResult, error: checkError } = await supabase
      .functions.invoke('check_team_role_permission', {
        body: { 
          team_id: invitation.team_id,
          action: 'invite_members' 
        }
      });
    
    if (checkError) {
      throw new Error(`Permission check failed: ${checkError.message}`);
    }
    
    if (!checkResult.can_invite) {
      throw new Error('You do not have permission to cancel invitations for this team');
    }
    
    // Cancel the invitation by updating its status
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);
    
    if (updateError) {
      throw new Error(`Failed to cancel invitation: ${updateError.message}`);
    }
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    throw error;
  }
}
