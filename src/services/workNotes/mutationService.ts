
import { supabase } from "@/integrations/supabase/client";
import { WorkNote } from "./types";
import { processDateFields } from "@/utils/authUtils";

/**
 * Create a new work note for equipment
 */
export async function createWorkNote(
  equipmentId: string, 
  note: string, 
  hoursWorked: number | null = null, 
  isPublic: boolean = false
): Promise<WorkNote> {
  if (!note || !note.trim()) {
    throw new Error("Note text cannot be empty");
  }
  
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  
  if (!userId) {
    throw new Error("User must be logged in to create work notes");
  }
  
  try {
    // Insert work note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: equipmentId,
        note: note.trim(),
        created_by: userId,
        is_public: isPublic,
        hours_worked: hoursWorked
      })
      .select('*')
      .single();
    
    if (error) {
      console.error("Error creating work note:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to create work note:", error);
    throw error;
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(
  noteId: string,
  updates: Partial<WorkNote>
): Promise<WorkNote> {
  if (!noteId) {
    throw new Error("Note ID is required");
  }
  
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  
  if (!userId) {
    throw new Error("User must be logged in to update work notes");
  }
  
  try {
    // Process any empty date fields to null
    const processedUpdates = processDateFields(updates, ['created_at', 'updated_at']);
    
    // Update the work note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update(processedUpdates)
      .eq('id', noteId)
      .select('*')
      .single();
    
    if (error) {
      console.error("Error updating work note:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to update work note:", error);
    throw error;
  }
}

/**
 * Delete a work note (soft delete)
 */
export async function deleteWorkNote(noteId: string): Promise<boolean> {
  if (!noteId) {
    throw new Error("Note ID is required");
  }
  
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  
  if (!userId) {
    throw new Error("User must be logged in to delete work notes");
  }
  
  try {
    // Soft delete by updating the deleted_at timestamp
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId);
    
    if (error) {
      console.error("Error deleting work note:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to delete work note:", error);
    throw error;
  }
}
