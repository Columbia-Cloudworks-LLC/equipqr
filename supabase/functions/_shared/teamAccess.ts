
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export async function canAccessTeam(
  supabase: SupabaseClient,
  userId: string, 
  teamId: string
): Promise<boolean> {
  // Use the secure RPC function to check access
  const { data, error } = await supabase.rpc('check_team_access', {
    user_id: userId,
    team_id: teamId
  });
  
  if (error) {
    console.error('Error checking team access:', error);
    return false;
  }
  
  return data === true;
}

export async function getTeamRole(
  supabase: SupabaseClient,
  userId: string,
  teamId: string
): Promise<string | null> {
  // Use the secure RPC function to get the team role
  const { data, error } = await supabase.rpc('get_team_role_safe', {
    _user_id: userId,
    _team_id: teamId
  });
  
  if (error) {
    console.error('Error getting team role:', error);
    return null;
  }
  
  return data;
}
