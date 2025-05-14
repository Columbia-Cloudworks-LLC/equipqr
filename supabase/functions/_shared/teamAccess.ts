
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Check if the user has access to the team with a specific role
 * Relies on the improved get_user_role_in_team function 
 * that properly handles viewers and other roles
 */
export async function checkTeamAccess(
  userId: string, 
  teamId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Call the security definer function that gets the role 
    // (which now properly handles viewers)
    const { data: role, error } = await client.rpc(
      'get_user_role_in_team',
      { p_user_uid: userId, p_team_id: teamId }
    );

    if (error) {
      console.error('Error checking team access:', error);
      return false;
    }

    // Any non-null role means the user has access
    return role !== null;
  } catch (error) {
    console.error('Exception in checkTeamAccess:', error);
    return false;
  }
}

/**
 * Check if a user can perform manager-level operations on a team
 * Depends on roles like manager, owner, creator, or admin
 */
export async function checkTeamManagerAccess(
  userId: string, 
  teamId: string,
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get the role for this user in this team
    const { data: role, error } = await client.rpc(
      'get_user_role_in_team',
      { p_user_uid: userId, p_team_id: teamId }
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
