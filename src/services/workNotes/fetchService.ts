
import { supabase } from "@/integrations/supabase/client";
import { WorkNote } from "./types";

/**
 * Get work notes for specific equipment
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    // Query work notes through RLS policies
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select(`
        *,
        creator:created_by(
          id,
          display_name,
          org:org_id(
            id,
            name
          )
        )
      `)
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching work notes:", error);
      throw error;
    }
    
    // Get the user's organization for determining external orgs
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    let userOrgId = null;
    if (userId) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
      
      userOrgId = userProfile?.org_id;
    }
    
    // Process and enhance work notes with additional information
    const enhancedNotes = data.map(note => {
      const creator = note.creator as any;
      const creatorOrg = creator?.org as any;
      
      const processedNote: WorkNote = {
        ...note,
        user_name: creator?.display_name || 'Unknown User',
        organization_name: creatorOrg?.name || 'Unknown Organization',
        organization_id: creatorOrg?.id || null,
        is_external_org: creatorOrg?.id !== userOrgId && !!creatorOrg?.id
      };
      
      delete processedNote.creator;
      return processedNote;
    });
    
    return enhancedNotes;
  } catch (error) {
    console.error("Failed to fetch work notes:", error);
    throw error;
  }
}
