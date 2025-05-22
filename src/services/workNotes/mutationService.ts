
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';
import { toast } from 'sonner';

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
 * Update an existing work note - with 24 hour window enforcement
 */
export async function updateWorkNote(
  noteId: string, 
  updates: Partial<WorkNote>
): Promise<WorkNote> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to update work notes');
    }

    // First check if user can edit this note (24 hour window & author check)
    const { data: canEdit, error: permissionError } = await supabase.rpc(
      'can_edit_work_note',
      { note_id: noteId, user_id: userId }
    );
    
    if (permissionError) {
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!canEdit) {
      throw new Error('You can only edit your own notes within 24 hours of creation');
    }
    
    // Don't allow updating certain fields
    const safeUpdates = {
      note: updates.note,
      is_public: updates.is_public,
      hours_worked: updates.hours_worked,
      edited_at: new Date().toISOString(),
      edited_by: userId
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
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to delete work notes');
    }
    
    // Check if note exists and user is the author
    const { data: note, error: fetchError } = await supabase
      .from('equipment_work_notes')
      .select('created_by')
      .eq('id', noteId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching work note:', fetchError);
      throw fetchError;
    }
    
    if (note.created_by !== userId) {
      throw new Error('You can only delete your own work notes');
    }
    
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
