
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
    
    console.log('Creating work note for equipment:', equipmentId);
    
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
    
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        throw new Error('Failed to create work note: Database constraint error');
      } else if (error.message.includes('permission denied')) {
        throw new Error('You do not have permission to create work notes for this equipment');
      } else {
        throw new Error(`Failed to create work note: ${error.message}`);
      }
    } else {
      throw new Error('Failed to create work note: Unknown error');
    }
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
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to update work notes');
    }

    // Check if user can edit this note (simplified version)
    const { data: existingNote } = await supabase
      .from('equipment_work_notes')
      .select('created_by, created_at')
      .eq('id', noteId)
      .single();
    
    if (!existingNote) {
      throw new Error('Work note not found');
    }
    
    if (existingNote.created_by !== userId) {
      throw new Error('You can only edit your own notes');
    }
    
    // Check 24-hour window
    const createdAt = new Date(existingNote.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      throw new Error('You can only edit notes within 24 hours of creation');
    }
    
    // Safe updates
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
    throw new Error(`Failed to update work note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a work note (soft delete)
 */
export async function deleteWorkNote(noteId: string): Promise<void> {
  try {
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
    throw new Error(`Failed to delete work note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
