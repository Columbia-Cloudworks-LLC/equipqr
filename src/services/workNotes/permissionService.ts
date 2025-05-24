
import { supabase } from "@/integrations/supabase/client";
import { WorkNotePermissions } from "./types";

/**
 * Check if user can create work notes for specific equipment
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.user) {
      console.log('No session, cannot create work notes');
      return false;
    }
    
    // With RLS disabled, any authenticated user can create notes
    // In production, you'd want to check equipment access permissions here
    return true;
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
      console.log('No user ID or equipment ID, cannot manage work notes');
      return false;
    }
    
    // With RLS disabled, any authenticated user can manage notes
    // In production, you'd want to check equipment access permissions here
    return true;
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
