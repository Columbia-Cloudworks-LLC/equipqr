
import { supabase } from "@/integrations/supabase/client";
import { WorkNote } from "./types";

/**
 * Get work notes for a specific equipment
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    // Use the RPC function to get work notes
    const { data, error } = await supabase
      .rpc('get_equipment_work_notes', { equipment_id: equipmentId });
      
    if (error) {
      console.error('Error fetching work notes:', error);
      throw new Error(`Failed to fetch work notes: ${error.message}`);
    }
    
    // Get user information for each note
    const notes = data as WorkNote[];
    const userIds = [...new Set(notes.map(note => note.created_by))];
    
    if (userIds.length > 0) {
      // Fetch user display names for the notes' creators
      const { data: appUsers, error: userError } = await supabase
        .from('app_user')
        .select('id, display_name')
        .in('id', userIds);
        
      if (!userError && appUsers) {
        // Create a map of user IDs to display names for quick lookup
        const userMap = new Map();
        appUsers.forEach(user => {
          userMap.set(user.id, user.display_name);
        });
        
        // Add creator name to each note
        return notes.map(note => ({
          ...note,
          creator_name: userMap.get(note.created_by) || 'Unknown User'
        }));
      }
    }
    
    return notes;
  } catch (error) {
    console.error('Exception in getWorkNotes:', error);
    throw error;
  }
}

/**
 * Get a single work note by ID
 */
export async function getWorkNoteById(noteId: string): Promise<WorkNote | null> {
  try {
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select('*')
      .eq('id', noteId)
      .is('deleted_at', null)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching work note by id:', error);
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Get creator name
    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('display_name')
      .eq('id', data.created_by)
      .maybeSingle();
      
    if (!userError && user) {
      return {
        ...data,
        creator_name: user.display_name
      } as WorkNote;
    }
    
    return data as WorkNote;
  } catch (error) {
    console.error('Exception in getWorkNoteById:', error);
    throw error;
  }
}
