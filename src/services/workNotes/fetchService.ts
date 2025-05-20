
import { supabase } from "@/integrations/supabase/client";
import { WorkNote } from "./types";

/**
 * Get work notes for an equipment item
 * @param equipmentId The equipment ID
 * @returns Array of work notes
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    // First check if user has session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('Authentication required to fetch work notes');
    }
    
    const userId = sessionData.session.user.id;
    
    // Efficient single query with joins to get notes with user data
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select(`
        *,
        creator:created_by (
          id,
          display_name,
          email
        ),
        equipment:equipment_id (
          org_id,
          team_id,
          team:team_id (name, org_id)
        )
      `)
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching work notes:', error);
      throw new Error(`Failed to fetch work notes: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get user profile to determine own organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    const userOrgId = userProfile?.org_id;
    
    // Process notes with additional metadata and type safety
    const processedNotes: WorkNote[] = data.map(note => {
      const equipmentOrgId = note.equipment?.org_id;
      const teamId = note.equipment?.team_id;
      const teamName = note.equipment?.team?.name;
      const teamOrgId = note.equipment?.team?.org_id;
      
      // Determine if this note is from an external organization
      const isExternalOrg = equipmentOrgId && userOrgId && equipmentOrgId !== userOrgId;
      
      // Safely handle creator data with proper null checks
      // Check if creator exists and is a proper object (not null or undefined)
      const isValidCreator = typeof note.creator === 'object' && note.creator !== null;
      
      // Default values for creator properties
      const creatorDisplayName = isValidCreator && note.creator.display_name 
        ? note.creator.display_name 
        : "Unknown User";
        
      const creatorEmail = isValidCreator && note.creator.email 
        ? note.creator.email 
        : "unknown@example.com";
        
      // Build the creator object with proper structure and null checks
      const creator = isValidCreator ? {
        id: note.creator.id || note.created_by,
        display_name: creatorDisplayName,
        email: creatorEmail
      } : {
        id: note.created_by,
        display_name: "Unknown User",
        email: "unknown@example.com"
      };

      return {
        ...note,
        is_external_org: isExternalOrg,
        organization_id: equipmentOrgId,
        organization_name: isExternalOrg ? "External Organization" : "Your Organization",
        team_id: teamId,
        team_name: teamName,
        created_by_name: creatorDisplayName,
        created_by_email: creatorEmail,
        creator
      } as WorkNote;
    });
    
    return processedNotes;
  } catch (error) {
    console.error('Error in getWorkNotes:', error);
    throw error;
  }
}
