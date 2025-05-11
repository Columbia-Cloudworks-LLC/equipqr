
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';

/**
 * Get work notes for a specific equipment item
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    // Fetch work notes using the security definer function
    const { data: notes, error } = await supabase
      .rpc('get_equipment_work_notes', { equipment_id: equipmentId });
      
    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }

    // Fetch creator details for each note
    const notesWithCreators = await Promise.all(notes.map(async (note) => {
      try {
        // Get creator information
        const { data: userData, error: userError } = await supabase
          .from('app_user')
          .select('display_name, email')
          .eq('id', note.created_by)
          .single();

        if (userError) {
          console.warn(`Couldn't fetch creator info for note ${note.id}:`, userError);
          return note;
        }

        return { ...note, creator: userData };
      } catch (err) {
        console.warn(`Error enriching work note with user data:`, err);
        return note;
      }
    }));

    return notesWithCreators;
  } catch (error) {
    console.error('Error in getWorkNotes:', error);
    throw error;
  }
}
