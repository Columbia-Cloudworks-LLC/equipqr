
import { supabase } from '@/integrations/supabase/client';

export async function cancelInvitation(invitationId: string): Promise<void> {
  try {
    // Get the invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('team_id, status')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been processed');
    }

    // Get the user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }

    // Check team access
    const { data: access, error: accessError } = await supabase
      .rpc('check_team_access_detailed', {
        user_id: sessionData.session.user.id,
        team_id: invitation.team_id
      });

    if (accessError || !access || !access.has_access) {
      throw new Error('You do not have permission to cancel this invitation');
    }

    // Only managers can cancel invitations
    if (access.team_role !== 'manager' && !access.is_org_owner) {
      throw new Error('Only team managers or organization owners can cancel invitations');
    }

    // Update the invitation status to cancelled
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
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    throw error;
  }
}
