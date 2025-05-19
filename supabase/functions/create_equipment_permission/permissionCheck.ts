
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Try multiple approaches to check equipment creation permission
 * with improved type handling and debugging
 */
export async function tryPermissionCheck(supabase: any, user_id: string, team_id: string | null) {
  // Validate input parameters again for safety
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(user_id)) {
    throw new Error('Invalid UUID format for user_id');
  }
  
  if (team_id !== null && team_id !== undefined && !uuidRegex.test(team_id)) {
    throw new Error('Invalid UUID format for team_id');
  }

  // Attempt #1: Try the simplified_equipment_create_permission function first (new optimized function)
  try {
    console.log('Attempt #1: Using simplified_equipment_create_permission');
    const { data: simplifiedData, error: simplifiedError } = await supabase.rpc(
      'simplified_equipment_create_permission',
      { 
        p_user_id: user_id,
        p_team_id: team_id
      }
    );

    if (simplifiedError) {
      console.error('Simplified permission check error:', simplifiedError);
      throw simplifiedError;
    }
    
    console.log('Attempt #1 successful:', simplifiedData);
    return simplifiedData;
  } catch (error1) {
    console.error('Attempt #1 failed:', error1);
    
    // Attempt #2: Try the check_equipment_create_permission function with explicit parameters
    try {
      console.log('Attempt #2: Using check_equipment_create_permission with explicit parameters');
      const { data, error } = await supabase.rpc(
        'check_equipment_create_permission',
        { 
          p_user_id: user_id,
          p_team_id: team_id
        }
      );

      if (error) {
        console.error('check_equipment_create_permission error:', error);
        throw error;
      }
      
      console.log('Attempt #2 successful:', data);
      
      // Process and normalize the result to ensure consistent format
      if (Array.isArray(data) && data.length > 0) {
        return {
          can_create: data[0].has_permission,
          org_id: data[0].org_id,
          reason: data[0].reason || 'unknown'
        };
      }
      return data;
    } catch (error2) {
      console.error('Attempt #2 failed:', error2);
      
      // Attempt #3: Try a direct database query approach with RPC function
      try {
        console.log('Attempt #3: Using rpc_check_equipment_permission function');
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'rpc_check_equipment_permission',
          { 
            user_id: user_id,
            action: 'create',
            team_id: team_id
          }
        );

        if (rpcError) {
          console.error('rpc_check_equipment_permission error:', rpcError);
          throw rpcError;
        }
        
        console.log('Attempt #3 successful:', rpcData);
        return rpcData;
      } catch (error3) {
        console.error('Attempt #3 failed:', error3);
        
        // Final attempt: Try with direct access to can_create_equipment_safe function
        try {
          console.log('Attempt #4: Using can_create_equipment_safe');
          const { data: safeData, error: safeError } = await supabase.rpc(
            'can_create_equipment_safe',
            { 
              p_user_id: user_id,
              p_team_id: team_id
            }
          );

          if (safeError) {
            console.error('can_create_equipment_safe error:', safeError);
            throw safeError;
          }
          
          console.log('Attempt #4 successful:', safeData);
          
          // Format response consistently
          return {
            can_create: safeData === true,
            org_id: null, // This function doesn't return org_id
            reason: safeData ? 'safe_check' : 'denied_by_safe_check'
          };
        } catch (error4) {
          console.error('Attempt #4 failed:', error4);
          throw new Error('All permission check methods failed');
        }
      }
    }
  }
}

/**
 * Initialize Supabase admin client
 */
export function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }
  
  console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`);
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
}
