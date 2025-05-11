
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';
import { getAppUserId } from '@/utils/authUtils';

/**
 * Create a new work note
 */
export async function createWorkNote(workNote: WorkNote): Promise<WorkNote> {
  try {
    // Get current auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      throw new Error('User must be logged in to create work notes');
    }

    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(sessionData.session.user.id);

    // Process hours_worked to ensure it's a number or null
    let hoursWorked: number | null = null;
    
    if (workNote.hours_worked !== undefined && workNote.hours_worked !== null) {
      if (typeof workNote.hours_worked === 'string') {
        const parsed = parseFloat(workNote.hours_worked as unknown as string);
        hoursWorked = isNaN(parsed) ? null : parsed;
      } else {
        hoursWorked = workNote.hours_worked;
      }
    }

    // Create the note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: workNote.equipment_id,
        created_by: appUserId,
        note: workNote.note,
        is_public: workNote.is_public,
        hours_worked: hoursWorked
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work note:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(id: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    // Process hours_worked to ensure it's a number or null
    let hoursWorked: number | null = null;
    
    if (updates.hours_worked !== undefined) {
      if (typeof updates.hours_worked === 'string') {
        const parsed = parseFloat(updates.hours_worked as unknown as string);
        hoursWorked = isNaN(parsed) ? null : parsed;
      } else {
        hoursWorked = updates.hours_worked;
      }
    }

    // Only managers can update notes (enforced by RLS)
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update({
        note: updates.note,
        is_public: updates.is_public,
        hours_worked: hoursWorked,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work note:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Soft delete a work note
 */
export async function deleteWorkNote(id: string): Promise<boolean> {
  try {
    // Only managers can delete notes (enforced by RLS)
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting work note:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkNote:', error);
    throw error;
  }
}
