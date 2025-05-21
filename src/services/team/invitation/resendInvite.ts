
import { supabase } from '@/integrations/supabase/client';

export async function resendInvite(invitationId: string): Promise<void> {
  if (!invitationId) {
    throw new Error('Invitation ID is required');
  }
  
  try {
    // First get the invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('id, team_id, email, token')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to find invitation: ${fetchError.message}`);
    }
    
    if (!invitation) {
      throw new Error('Invitation not found or already accepted');
    }
    
    // Check if user has permission to resend invites for this team
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
      throw new Error('You do not have permission to resend invitations for this team');
    }
    
    // Update the invitation expiry time
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ 
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .eq('id', invitationId);
    
    if (updateError) {
      throw new Error(`Failed to update invitation: ${updateError.message}`);
    }
    
    // Trigger email resend via edge function
    const { error: emailError } = await supabase
      .functions.invoke('resend_team_invitation', {
        body: { invitation_id: invitationId }
      });
    
    if (emailError) {
      throw new Error(`Failed to resend invitation email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error('Error in resendInvite:', error);
    throw error;
  }
}
