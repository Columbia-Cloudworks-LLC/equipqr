
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';

/**
 * Create a new work note for a piece of equipment
 */
export async function createWorkNote(
  equipmentId: string, 
  note: string, 
  hoursWorked: number | null = null, 
  isPublic: boolean = true
): Promise<WorkNote> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to create work notes');
    }
    
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: equipmentId,
        note,
        created_by: userId,
        is_public: isPublic,
        hours_worked: hoursWorked
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating work note:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkNote:', error);
    throw new Error(`Failed to create work note: ${error.message}`);
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(
  noteId: string, 
  updates: Partial<WorkNote>
): Promise<WorkNote> {
  try {
    // Don't allow updating certain fields
    const safeUpdates = {
      note: updates.note,
      is_public: updates.is_public,
      hours_worked: updates.hours_worked
    };
    
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update(safeUpdates)
      .eq('id', noteId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating work note:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateWorkNote:', error);
    throw new Error(`Failed to update work note: ${error.message}`);
  }
}

/**
 * Delete a work note (soft delete)
 */
export async function deleteWorkNote(noteId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId);
    
    if (error) {
      console.error('Error deleting work note:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteWorkNote:', error);
    throw new Error(`Failed to delete work note: ${error.message}`);
  }
}
