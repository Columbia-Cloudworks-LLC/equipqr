
import { supabase } from '@/integrations/supabase/client';

export async function cancelInvitation(invitationId: string): Promise<any> {
  try {
    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }
    
    // Get invitation details to check team ID
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('id, team_id')
      .eq('id', invitationId)
      .single();
      
    if (inviteError) {
      throw new Error(`Failed to get invitation: ${inviteError.message}`);
    }
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    // Check if user has permission to cancel invitations for this team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: invitation.team_id, 
        user_id: sessionData.session.user.id
      }
    });
    
    if (!permissionData?.can_modify_members) {
      throw new Error('You do not have permission to cancel invitations');
    }
    
    // Update the invitation status to 'cancelled'
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
      
    if (updateError) {
      throw new Error(`Failed to cancel invitation: ${updateError.message}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    throw error;
  }
}
