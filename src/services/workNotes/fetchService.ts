
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';

/**
 * Fetch work notes for a piece of equipment
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    console.log(`Fetching work notes for equipment: ${equipmentId}`);
    
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select('*')
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }
    
    // For each work note, try to fetch the creator's details if available
    const notesWithUserInfo = await Promise.all(
      data.map(async (note) => {
        try {
          // Only try to get user info if we have a created_by value
          if (note.created_by) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('display_name, org_id')
              .eq('id', note.created_by)
              .single();
              
            if (userData) {
              // Try to get organization name
              const { data: orgData } = await supabase
                .from('organization')
                .select('name')
                .eq('id', userData.org_id)
                .single();
                
              return {
                ...note,
                organization_id: userData.org_id,
                organization_name: orgData?.name || 'Unknown Organization',
                is_external_org: false // Default to false
              };
            }
          }
          return note;
        } catch (err) {
          console.log('Error fetching user info for note:', err);
          return note;
        }
      })
    );
    
    console.log(`Found ${notesWithUserInfo.length} work notes`);
    return notesWithUserInfo;
  } catch (err) {
    console.error('Error in getWorkNotes:', err);
    throw new Error(`Failed to fetch work notes: ${err.message}`);
  }
}
