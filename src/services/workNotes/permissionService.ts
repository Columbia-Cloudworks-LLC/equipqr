
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user can edit work notes
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;
    
    // Call the check_work_notes_access edge function which uses direct queries 
    // to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('check_work_notes_access', {
      body: {
        equipment_id: equipmentId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error checking work note permissions:', error);
      return false;
    }
    
    // Return the can_manage permission from the result
    return data?.can_manage || false;
  } catch (error) {
    console.error('Error checking work note permissions:', error);
    return false;
  }
}

/**
 * Check if the current user can create work notes (managers and technicians)
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;
    
    // Call the check_work_notes_access edge function which uses direct queries
    // to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('check_work_notes_access', {
      body: {
        equipment_id: equipmentId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error checking work note creation permissions:', error);
      return false;
    }
    
    // Return the can_create permission from the result
    return data?.can_create || false;
  } catch (error) {
    console.error('Error checking work note creation permissions:', error);
    return false;
  }
}
