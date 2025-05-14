
import { supabase } from "@/integrations/supabase/client";
import { WorkNotePermissions } from "./types";

/**
 * Check if user can create work notes for specific equipment
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId || !equipmentId) {
      return false;
    }
    
    // Get equipment details to check roles
    const { data: equipment } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .is('deleted_at', null)
      .single();
      
    if (!equipment) {
      return false;
    }
    
    // Check specific roles through edge function
    try {
      const { data, error } = await supabase.functions.invoke('check_equipment_permission', {
        body: {
          user_id: userId,
          equipment_id: equipmentId,
          action: 'create'
        }
      });
      
      if (error) throw error;
      return data?.has_permission === true;
    } catch (fnError) {
      console.error("Error checking permissions:", fnError);
      
      // Fallback: Check if user's org matches equipment's org
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
        
      return userProfile?.org_id === equipment.org_id;
    }
  } catch (error) {
    console.error("Error checking create permissions:", error);
    return false;
  }
}

/**
 * Check if user can manage (edit) work notes for specific equipment
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId || !equipmentId) {
      return false;
    }
    
    // Check through edge function
    try {
      const { data, error } = await supabase.functions.invoke('check_equipment_permission', {
        body: {
          user_id: userId,
          equipment_id: equipmentId,
          action: 'edit'
        }
      });
      
      if (error) throw error;
      return data?.has_permission === true;
    } catch (fnError) {
      console.error("Error checking management permissions:", fnError);
      
      // Fallback: Check if user is equipment org's owner/manager
      const { data: equipment } = await supabase
        .from('equipment')
        .select('org_id')
        .eq('id', equipmentId)
        .single();
        
      if (!equipment) return false;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', equipment.org_id)
        .in('role', ['owner', 'manager'])
        .single();
        
      return !!roles;
    }
  } catch (error) {
    console.error("Error checking manage permissions:", error);
    return false;
  }
}

/**
 * Get detailed work note permissions for a user
 */
export async function getWorkNotePermissions(equipmentId: string): Promise<WorkNotePermissions> {
  try {
    const [canCreate, canManage] = await Promise.all([
      canCreateWorkNotes(equipmentId),
      canManageWorkNotes(equipmentId)
    ]);
    
    return {
      canCreate,
      canManage,
      canDelete: canManage
    };
  } catch (error) {
    console.error("Error getting work note permissions:", error);
    return {
      canCreate: false,
      canManage: false,
      canDelete: false,
      reason: 'error'
    };
  }
}
