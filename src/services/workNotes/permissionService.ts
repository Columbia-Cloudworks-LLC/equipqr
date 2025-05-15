
import { supabase } from "@/integrations/supabase/client";
import { WorkNotePermissions } from "./types";

/**
 * Check if user can create work notes for specific equipment
 * Simplified version that doesn't rely on edge functions
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    // If not logged in, can't create notes
    if (!sessionData?.session?.user) {
      console.log('No session, cannot create work notes');
      return false;
    }
    
    // With RLS off, any authenticated user can create notes
    return true;
  } catch (error) {
    console.error("Error checking create permissions:", error);
    return false;
  }
}

/**
 * Check if user can manage (edit) work notes for specific equipment
 * Simplified version that doesn't rely on edge functions
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId || !equipmentId) {
      console.log('No user ID or equipment ID, cannot manage work notes');
      return false;
    }
    
    // With RLS off, any authenticated user can manage notes
    // In a production environment, we'd check org ownership and roles
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
