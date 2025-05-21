
import { supabase } from '@/integrations/supabase/client';

/**
 * A fallback permission check that grants access based on organization ownership
 * Used when more specific permission checks fail or are not applicable
 */
export async function fallbackPermissionCheck(
  equipmentId: string | null, 
  orgId: string | null
): Promise<boolean> {
  try {
    if (!equipmentId && !orgId) {
      return false;
    }
    
    // Get current user
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    if (!userId) {
      return false;
    }
    
    // If we have an equipment ID, get its org_id
    let targetOrgId = orgId;
    
    if (equipmentId && !targetOrgId) {
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('org_id')
        .eq('id', equipmentId)
        .maybeSingle();
        
      if (error || !equipment) {
        console.error('Error fetching equipment for permission check:', error);
        return false;
      }
      
      targetOrgId = equipment.org_id;
    }
    
    if (!targetOrgId) {
      return false;
    }
    
    // Check if user has organization access
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_org_role', {
        p_auth_user_id: userId,
        p_org_id: targetOrgId
      });
      
    if (roleError) {
      console.error('Error checking org role:', roleError);
      return false;
    }
    
    // At minimum, viewer role is required
    return !!roleData;
  } catch (error) {
    console.error('Error in fallbackPermissionCheck:', error);
    return false;
  }
}
