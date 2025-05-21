
import { supabase } from '@/integrations/supabase/client';

export async function getPendingInvitations(teamId: string) {
  try {
    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }
    
    // Check if user has access to the team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId, 
        user_id: sessionData.session.user.id
      }
    });
    
    if (!permissionData?.can_view) {
      throw new Error('You do not have permission to view this team');
    }
    
    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('id, email, role, status, created_at, expires_at')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (invitationsError) {
      throw new Error(`Failed to get invitations: ${invitationsError.message}`);
    }
    
    return invitations;
  } catch (error: any) {
    console.error('Error getting pending invitations:', error);
    throw error;
  }
}
