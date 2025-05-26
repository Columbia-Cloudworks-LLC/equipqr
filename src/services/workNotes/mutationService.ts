
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';

/**
 * Create a new work note
 */
export async function createWorkNote(
  equipmentId: string, 
  note: string, 
  hoursWorked: number | null = null, 
  isPublic: boolean = false,
  workOrderId?: string
): Promise<WorkNote> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to create work notes');
    }

    console.log('Creating work note:', { equipmentId, note, hoursWorked, isPublic, workOrderId });

    // Get app_user.id from auth.uid for foreign key constraint
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();

    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      throw new Error('User profile not found');
    }

    const noteData = {
      equipment_id: equipmentId,
      note: note.trim(),
      hours_worked: hoursWorked,
      is_public: isPublic,
      created_by: appUser.id,
      work_order_id: workOrderId || null
    };

    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert(noteData)
      .select()
      .single();

    if (error) {
      console.error('Error creating work note:', error);
      throw error;
    }

    console.log('Work note created successfully:', data.id);
    return data as WorkNote;
  } catch (error: any) {
    console.error('Error in createWorkNote:', error);
    throw new Error(`Failed to create work note: ${error.message}`);
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(id: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to update work notes');
    }

    console.log('Updating work note:', id, updates);

    // Get app_user.id from auth.uid for edit tracking
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();

    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      throw new Error('User profile not found');
    }

    const updateData = {
      ...updates,
      edited_by: appUser.id,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work note:', error);
      throw error;
    }

    console.log('Work note updated successfully:', data.id);
    return data as WorkNote;
  } catch (error: any) {
    console.error('Error in updateWorkNote:', error);
    throw new Error(`Failed to update work note: ${error.message}`);
  }
}

/**
 * Delete a work note (soft delete)
 */
export async function deleteWorkNote(id: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to delete work notes');
    }

    console.log('Deleting work note:', id);

    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting work note:', error);
      throw error;
    }

    console.log('Work note deleted successfully:', id);
  } catch (error: any) {
    console.error('Error in deleteWorkNote:', error);
    throw new Error(`Failed to delete work note: ${error.message}`);
  }
}
