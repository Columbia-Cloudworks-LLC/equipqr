
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the user has access to the team using our non-recursive function
 */
export async function checkTeamAccess(
  userId: string, 
  teamId: string, 
  customClient?: typeof supabase
) {
  try {
    // Use provided supabase client or the default one
    const client = customClient || supabase;
    
    // Call our non-recursive function
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
  customClient?: typeof supabase
) {
  try {
    // Use provided supabase client or the default one
    const client = customClient || supabase;
    
    // Get the role for this user in this team using our safe function
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

/**
 * Get detailed access information for a team
 * Uses our validate_team_access edge function with retry logic
 */
export async function getDetailedTeamAccess(
  userId: string, 
  teamId: string,
  customClient?: typeof supabase
) {
  try {
    // Use provided supabase client or the default one
    const client = customClient || supabase;
    
    // Try up to 3 times with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 100; // Start with 100ms delay
    
    while (attempts < maxAttempts) {
      try {
        // Call the validate_team_access edge function
        const { data, error } = await client.functions.invoke('validate_team_access', {
          body: { 
            user_id: userId,
            team_id: teamId
          }
        });

        if (error) {
          console.error(`Error getting detailed team access (attempt ${attempts + 1}):`, error);
          // Only throw if it's the last attempt
          if (attempts === maxAttempts - 1) {
            throw error;
          }
        } else {
          // Success - return the data
          return data;
        }
      } catch (retryError) {
        console.error(`Retry error (attempt ${attempts + 1}):`, retryError);
        // Only throw if it's the last attempt
        if (attempts === maxAttempts - 1) {
          throw retryError;
        }
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay and attempts for next iteration
      delay *= 2;
      attempts++;
    }
    
    throw new Error("Exceeded maximum retry attempts");
  } catch (error) {
    console.error('Exception in getDetailedTeamAccess:', error);
    return {
      is_member: false,
      has_org_access: false,
      access_reason: 'error'
    };
  }
}
