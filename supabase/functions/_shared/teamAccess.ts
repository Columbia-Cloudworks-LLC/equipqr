
// Helper functions for team access validation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Check if a user has access to a team
 */
export async function validateTeamAccess(userId: string, teamId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_access_team', {
    p_uid: userId,
    p_team_id: teamId
  });
  
  if (error) {
    console.error('Error checking team access:', error);
    throw error;
  }
  
  return !!data;
}

/**
 * Check if a user has a specific role in a team
 */
export async function validateTeamRole(userId: string, teamId: string, role: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: userRole } = await supabase.rpc('get_team_role_safe', {
    _user_id: userId,
    _team_id: teamId
  });
  
  return userRole === role;
}
