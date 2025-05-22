
import { supabase } from '@/integrations/supabase/client';

export async function resendInvite(invitationId: string): Promise<void> {
  try {
    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }
    
    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('id, team_id, email, status')
      .eq('id', invitationId)
      .single();
      
    if (inviteError) {
      throw new Error(`Failed to get invitation: ${inviteError.message}`);
    }
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot resend invitation with status '${invitation.status}'`);
    }
    
    // Check if user can modify this team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: invitation.team_id, 
        user_id: sessionData.session.user.id
      }
    });
    
    if (!permissionData?.can_modify_members) {
      throw new Error('You do not have permission to resend invitations');
    }
    
    // Update the invitation expiry
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
      
    if (updateError) {
      throw new Error(`Failed to update invitation: ${updateError.message}`);
    }
    
    // Resend the email by calling the edge function
    const { error: emailError } = await supabase.functions.invoke('resend_team_invitation', {
      body: {
        invitation_id: invitationId
      }
    });
    
    if (emailError) {
      throw new Error(`Failed to resend invitation email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    throw error;
  }
}
