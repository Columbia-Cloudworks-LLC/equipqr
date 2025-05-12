
import { supabase } from "@/integrations/supabase/client";
import { WorkNote } from "./types";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Create a new work note
 */
export async function createWorkNote(equipmentId: string, note: string, hoursWorked?: number, isPublic: boolean = false): Promise<WorkNote> {
  try {
    // Get current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create work notes');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(authUserId);
    
    // Create the work note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: equipmentId,
        note,
        hours_worked: hoursWorked,
        is_public: isPublic,
        created_by: appUserId
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating work note:', error);
      throw new Error(`Failed to create work note: ${error.message}`);
    }
    
    return data as WorkNote;
  } catch (error) {
    console.error('Exception in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update a work note
 */
export async function updateWorkNote(noteId: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    // Remove fields that shouldn't be directly updated
    const { id, created_at, created_by, equipment_id, ...validUpdates } = updates;
    
    // Add updated timestamp
    const noteUpdates = {
      ...validUpdates,
      updated_at: new Date().toISOString()
    };
    
    // Update the work note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update(noteUpdates)
      .eq('id', noteId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating work note:', error);
      throw new Error(`Failed to update work note: ${error.message}`);
    }
    
    return data as WorkNote;
  } catch (error) {
    console.error('Exception in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Soft delete a work note
 */
export async function deleteWorkNote(noteId: string): Promise<void> {
  try {
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
      
    if (error) {
      console.error('Error deleting work note:', error);
      throw new Error(`Failed to delete work note: ${error.message}`);
    }
  } catch (error) {
    console.error('Exception in deleteWorkNote:', error);
    throw error;
  }
}
