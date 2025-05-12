
// Helper functions to check equipment access permissions
// Now leverages the database security definer functions instead of custom logic

import { corsHeaders } from './corsHeaders.ts';

// Helper function to check equipment access
export async function checkEquipmentAccess(supabase, userId, equipmentId) {
  try {
    console.log(`Checking equipment access for user ${userId} on equipment ${equipmentId}`);
    
    // Use the new can_access_equipment function to check access
    const { data, error } = await supabase.rpc('can_access_equipment', {
      p_uid: userId,
      p_equipment_id: equipmentId
    });
    
    if (error) {
      console.error('Error checking equipment access:', error);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: error.message }
      };
    }
    
    // Check if user can edit the equipment
    let canEdit = false;
    let role = 'viewer';
    
    if (data === true) {
      // Check if user can edit the equipment
      const { data: editData, error: editError } = await supabase.rpc('can_edit_equipment', {
        p_uid: userId,
        p_equipment_id: equipmentId
      });
      
      if (!editError && editData === true) {
        canEdit = true;
        role = 'editor';
      }
      
      return {
        hasAccess: true,
        reason: 'permission_granted',
        role: role,
        details: {
          canEdit: canEdit
        }
      };
    }
    
    // No access granted
    return { 
      hasAccess: false, 
      reason: 'no_permission' 
    };
  } catch (error) {
    console.error('Error in checkEquipmentAccess:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}
