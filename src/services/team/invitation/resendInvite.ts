
import { supabase } from '@/integrations/supabase/client';

export async function resendInvite(invitationId: string): Promise<void> {
  try {
    // Check if the invitation exists
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('id, email, team_id')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invitation not found or already processed');
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
      throw new Error('You do not have permission to resend this invitation');
    }

    // Update the expiration date to extend it
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

    // Trigger email sending via edge function
    const { error: emailError } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        invitation_id: invitationId,
        type: 'team'
      }
    });

    if (emailError) {
      console.warn('Warning: Failed to send invitation email', emailError);
      // We don't throw here as the invitation was updated successfully
    }
  } catch (error: any) {
    console.error('Error in resendInvite:', error);
    throw error;
  }
}
