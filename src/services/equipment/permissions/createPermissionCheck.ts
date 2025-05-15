
import { supabase } from "@/integrations/supabase/client";

/**
 * Simplified permission check for equipment creation
 * Using a direct edge function that avoids UUID comparison issues
 */
export async function checkCreatePermission(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using simplified permission check for equipment creation');
    console.log(`Parameters: authUserId=${authUserId}, teamId=${teamId || 'none'}`);
    
    // Call our dedicated edge function for equipment creation permission
    const { data, error } = await supabase.functions.invoke(
      'create_equipment_permission',
      {
        body: {
          user_id: authUserId,
          team_id: teamId && teamId !== 'none' ? teamId : null
        }
      }
    );
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    if (!data) {
      console.error('No data returned from permission check');
      throw new Error('Invalid response from permission service');
    }
    
    console.log('Permission check result:', data);
    
    // Handle permission denied
    if (!data.can_create) {
      throw new Error(`You don't have permission to create equipment. Reason: ${data.reason}`);
    }
    
    // Return simplified result with essential data
    return {
      hasPermission: true,
      orgId: data.org_id
    };
  } catch (error) {
    console.error('Permission check error:', error);
    throw error;
  }
}

/**
 * Fallback is now also using the simplified database function
 * to avoid the complex permission chain that was causing errors
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using simplified fallback permission check with RPC');
    
    // Use our simplified database function directly
    const { data, error } = await supabase.rpc(
      'simplified_equipment_create_permission',
      { 
        p_user_id: authUserId,
        p_team_id: teamId && teamId !== 'none' ? teamId : null
      }
    );
    
    if (error) {
      console.error('RPC permission check error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data);
      throw new Error('Failed to determine permission');
    }
    
    if (!data.can_create) {
      throw new Error(`You don't have permission to create equipment. Reason: ${data.reason}`);
    }
    
    return { 
      hasPermission: true, 
      orgId: data.org_id 
    };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
