
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user can create equipment for a given team
 * Uses the Edge Function for better performance and reliability
 */
export async function checkCreatePermission(
  authUserId: string, 
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  try {
    console.log('Checking equipment creation permission via edge function', {
      authUserId,
      teamId,
      orgId
    });
    
    const { data, error } = await supabase.functions.invoke('check_equipment_create_permission', {
      body: { user_id: authUserId, team_id: teamId, org_id: orgId }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Permission check returned no data');
    }
    
    // Check if we have a permission result with the expected format
    if (typeof data.can_create !== 'boolean') {
      throw new Error('Invalid permission response format');
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: data.org_id || orgId || null,
      hasPermission: data.can_create,
      reason: data.reason || 'unknown'
    };
  } catch (error: any) {
    console.error('Error in checkCreatePermission:', error);
    throw error;
  }
}
