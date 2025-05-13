
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Helper function to check if a user has access to a team
export async function canAccessTeam(userId: string, teamId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_access_team', {
    p_uid: userId,
    p_team_id: teamId
  });
  
  if (error) {
    console.error('Error checking team access:', error);
    return false;
  }
  
  return data === true;
}

// Helper function to get user's role in a team
export async function getUserRoleInTeam(userId: string, teamId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('get_user_role_in_team', {
    p_user_uid: userId,
    p_team_id: teamId
  });
  
  if (error) {
    console.error('Error getting team role:', error);
    return null;
  }
  
  return data;
}
