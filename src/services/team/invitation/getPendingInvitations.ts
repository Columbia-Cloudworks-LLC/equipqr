
import { supabase } from '@/integrations/supabase/client';

export async function getPendingInvitations(teamId: string): Promise<any[]> {
  try {
    // Get the user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }

    // Check team access
    const { data: access, error: accessError } = await supabase
      .rpc('check_team_access_detailed', {
        user_id: sessionData.session.user.id,
        team_id: teamId
      });

    if (accessError) {
      throw new Error(`Access check failed: ${accessError.message}`);
    }

    if (!access || !access.has_access) {
      throw new Error('You do not have access to this team');
    }

    // Fetch pending invitations
    const { data: invitations, error: inviteError } = await supabase
      .from('team_invitations')
      .select('id, email, role, created_at, expires_at, invited_by_email')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (inviteError) {
      throw new Error(`Failed to fetch invitations: ${inviteError.message}`);
    }

    return invitations || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitations:', error);
    throw error;
  }
}
