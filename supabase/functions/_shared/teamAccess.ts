
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Check if the user has access to the team using our non-recursive function
 */
export async function checkTeamAccess(
  userId: string, 
  teamId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one with admin privileges
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Call our non-recursive function that avoids RLS issues
    const { data: hasAccess, error } = await client.rpc(
      'check_team_access_nonrecursive',
      { p_user_id: userId, p_team_id: teamId }
    );

    if (error) {
      console.error('Error checking team access:', error);
      return false;
    }

    return !!hasAccess;
  } catch (error) {
    console.error('Exception in checkTeamAccess:', error);
    return false;
  }
}

/**
 * Check if a user can perform manager-level operations on a team
 * Uses our optimized get_team_role_safe function
 */
export async function checkTeamManagerAccess(
  userId: string, 
  teamId: string,
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one with admin privileges
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get the role for this user in this team using the safe function
    const { data: role, error } = await client.rpc(
      'get_team_role_safe',
      { _user_id: userId, _team_id: teamId }
    );

    if (error) {
      console.error('Error checking team manager access:', error);
      return false;
    }

    // These roles have manager-level access
    const managerRoles = ['manager', 'owner', 'creator', 'admin'];
    return role !== null && managerRoles.includes(role);
  } catch (error) {
    console.error('Exception in checkTeamManagerAccess:', error);
    return false;
  }
}
