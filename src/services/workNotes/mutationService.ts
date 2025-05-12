
import { supabase } from '@/integrations/supabase/client';
import { getAppUserId } from '@/utils/authUtils';
import { WorkNote } from './types';

/**
 * Create a new work note for equipment
 */
export async function createWorkNote(data: {
  equipment_id: string;
  note: string;
  is_public: boolean;
  hours_worked: number | null;
}): Promise<WorkNote> {
  try {
    // Get current user's app_user ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to create work notes');
    }
    
    const userId = sessionData.session.user.id;
    
    // First check permission using the edge function
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_work_notes_access', 
      {
        body: {
          equipment_id: data.equipment_id,
          user_id: userId
        }
      }
    );
    
    if (permissionError || !permissionCheck?.can_create) {
      throw new Error('You do not have permission to create work notes for this equipment');
    }
    
    // Get app_user ID for database reference
    const appUserId = await getAppUserId(userId);
    
    // Create the work note
    const { data: workNote, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: data.equipment_id,
        note: data.note,
        is_public: data.is_public,
        hours_worked: data.hours_worked,
        created_by: appUserId
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating work note:', error);
      throw new Error('Failed to add work note');
    }
    
    return workNote as WorkNote;
  } catch (error: any) {
    console.error('Error in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(id: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to update work notes');
    }
    
    const userId = sessionData.session.user.id;
    
    // First get the note to check the equipment ID
    const { data: note, error: noteError } = await supabase
      .from('equipment_work_notes')
      .select('equipment_id')
      .eq('id', id)
      .single();
      
    if (noteError) {
      console.error('Error getting work note:', noteError);
      throw new Error('Work note not found');
    }
    
    // Check permission using the edge function
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_work_notes_access', 
      {
        body: {
          equipment_id: note.equipment_id,
          user_id: userId
        }
      }
    );
    
    if (permissionError || !permissionCheck?.can_manage) {
      throw new Error('You do not have permission to update this work note');
    }
    
    // Only allow specific fields to be updated
    const validUpdates = {
      note: updates.note,
      is_public: updates.is_public,
      hours_worked: updates.hours_worked
    };
    
    // Update the work note
    const { data: updatedNote, error } = await supabase
      .from('equipment_work_notes')
      .update(validUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating work note:', error);
      throw new Error('Failed to update work note');
    }
    
    return updatedNote as WorkNote;
  } catch (error: any) {
    console.error('Error in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Delete a work note (soft delete)
 */
export async function deleteWorkNote(id: string): Promise<boolean> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to delete work notes');
    }
    
    const userId = sessionData.session.user.id;
    
    // First get the note to check the equipment ID
    const { data: note, error: noteError } = await supabase
      .from('equipment_work_notes')
      .select('equipment_id')
      .eq('id', id)
      .single();
      
    if (noteError) {
      console.error('Error getting work note:', noteError);
      throw new Error('Work note not found');
    }
    
    // Check permission using the edge function
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_work_notes_access', 
      {
        body: {
          equipment_id: note.equipment_id,
          user_id: userId
        }
      }
    );
    
    if (permissionError || !permissionCheck?.can_manage) {
      throw new Error('You do not have permission to delete this work note');
    }
    
    // Soft delete the work note
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting work note:', error);
      throw new Error('Failed to delete work note');
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in deleteWorkNote:', error);
    throw error;
  }
}
