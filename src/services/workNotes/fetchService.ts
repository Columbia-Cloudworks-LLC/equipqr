
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';

/**
 * Fetch work notes for a specific piece of equipment
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to view work notes');
    }
    
    console.log('Fetching work notes for equipment:', equipmentId);
    
    // Simplified query without complex joins that might cause issues
    const { data: notes, error } = await supabase
      .from('equipment_work_notes')
      .select('*')
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }
    
    console.log(`Found ${notes?.length || 0} work notes`);
    
    // Get user profiles for the note creators/editors
    const userIds = [...new Set([
      ...notes?.map(note => note.created_by).filter(Boolean) || [],
      ...notes?.map(note => note.edited_by).filter(Boolean) || []
    ])];
    
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      userProfiles = profiles || [];
    }
    
    // Enrich notes with user information
    const enrichedNotes = notes?.map(note => ({
      ...note,
      creator: {
        display_name: userProfiles.find(p => p.id === note.created_by)?.display_name || 'Unknown User'
      },
      editor: note.edited_by ? {
        display_name: userProfiles.find(p => p.id === note.edited_by)?.display_name || 'Unknown User'
      } : null
    })) || [];
    
    return enrichedNotes as WorkNote[];
  } catch (error: any) {
    console.error('Error in getWorkNotes:', error);
    throw new Error(`Failed to fetch work notes: ${error.message}`);
  }
}

/**
 * Get organizations associated with work notes
 */
export async function getWorkNoteOrganizations(equipmentId: string): Promise<any[]> {
  try {
    // Simple implementation - just return empty array for now
    return [];
  } catch (error: any) {
    console.error('Error in getWorkNoteOrganizations:', error);
    return [];
  }
}
