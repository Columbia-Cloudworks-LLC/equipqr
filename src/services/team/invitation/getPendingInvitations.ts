
import { supabase } from '@/integrations/supabase/client';

export async function getPendingInvitations(teamId: string) {
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  
  try {
    // Check team exists
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('id')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      if (teamError.code === 'PGRST116') {
        throw { message: 'Team not found or has been deleted', code: 'TEAM_NOT_FOUND' };
      }
      throw new Error(`Failed to check team: ${teamError.message}`);
    }
    
    // Verify user has access to view team invitations
    const { data: accessCheck, error: accessError } = await supabase
      .functions.invoke('validate_team_access', {
        body: { team_id: teamId }
      });
    
    if (accessError) {
      throw new Error(`Team access check failed: ${accessError.message}`);
    }
    
    if (!accessCheck.is_member) {
      throw new Error('You do not have access to this team');
    }
    
    // Get the invitations
    const { data, error } = await supabase
      .from('team_invitations')
      .select('id, email, role, status, created_at, created_by, expires_at, updated_at')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get pending invitations: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitations:', error);
    throw error;
  }
}
