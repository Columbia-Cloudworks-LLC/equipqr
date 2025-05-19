
// Import types while avoiding circular references
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Helper function to initialize Supabase client
export function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Try multiple permission check approaches and return the first successful one
export async function tryPermissionCheck(
  supabase: any, 
  userId: string, 
  teamId: string | null
): Promise<any> {
  console.log('Trying permission check with params:', { userId, teamId });
  
  // Approach 1: Use the simplified function first (most optimized)
  try {
    console.log('Trying simplified_equipment_create_permission');
    const { data, error } = await supabase.rpc(
      'simplified_equipment_create_permission',
      { 
        p_user_id: userId,
        p_team_id: teamId
      }
    );
    
    if (error) {
      console.error('Simplified permission check failed:', error);
      throw error;
    }
    
    console.log('Simplified permission check result:', data);
    return {
      has_permission: data.can_create,
      org_id: data.org_id,
      reason: data.reason
    };
  } catch (error) {
    console.warn('Simplified permission check failed, trying alternative:', error);
  }
  
  // Approach 2: Try the dedicated checks function
  try {
    console.log('Trying check_equipment_create_permission');
    const { data, error } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: userId,
        p_team_id: teamId
      }
    );
    
    if (error) {
      console.error('Standard permission check failed:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('Empty result from check_equipment_create_permission');
      throw new Error('Permission check returned no data');
    }
    
    console.log('Standard permission check result:', data);
    return {
      has_permission: data[0].has_permission,
      org_id: data[0].org_id,
      reason: data[0].reason
    };
  } catch (error) {
    console.warn('Standard check failed, trying fallback:', error);
  }
  
  // Approach 3: Use the generic RPC check with more parameters
  try {
    console.log('Trying rpc_check_equipment_permission as fallback');
    const { data, error } = await supabase.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: userId,
        action: 'create',
        team_id: teamId
      }
    );
    
    if (error) {
      console.error('Fallback permission check failed:', error);
      throw error;
    }
    
    console.log('RPC permission check result:', data);
    
    // Handle different response formats
    const hasPermission = typeof data === 'object' && 'has_permission' in data ? 
                        !!data.has_permission : false;
    
    return {
      has_permission: hasPermission,
      org_id: typeof data === 'object' && 'org_id' in data ? data.org_id : null,
      reason: typeof data === 'object' && 'reason' in data ? data.reason : 'fallback'
    };
  } catch (error) {
    console.error('All permission check methods failed');
    throw error;
  }
}
