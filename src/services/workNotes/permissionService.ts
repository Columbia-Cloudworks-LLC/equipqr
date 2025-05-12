
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user has permission to manage work notes
 * for a specific equipment
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Use the edge function to check work notes permissions
    const { data, error } = await supabase.functions.invoke('check_work_notes_access', {
      body: {
        equipment_id: equipmentId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error checking work notes access:', error);
      return false;
    }
    
    // Return whether user can manage notes
    return data?.can_manage || false;
  } catch (error) {
    console.error('Exception in canManageWorkNotes:', error);
    return false;
  }
}

/**
 * Check if the current user has permission to create work notes
 * for a specific equipment
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Use the edge function to check work notes permissions
    const { data, error } = await supabase.functions.invoke('check_work_notes_access', {
      body: {
        equipment_id: equipmentId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error checking work notes access:', error);
      return false;
    }
    
    // Return whether user can create notes
    return data?.can_create || false;
  } catch (error) {
    console.error('Exception in canCreateWorkNotes:', error);
    return false;
  }
}
