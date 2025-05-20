
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
      
      // First check if note.creator exists at all
      if (note.creator === null) {
        // Handle null creator case directly
        const fallbackCreator = {
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
          created_by_name: "Unknown User",
          created_by_email: "unknown@example.com",
          creator: fallbackCreator
        } as WorkNote;
      }
      
      // Now we know creator is not null, we can check if it's an error object
      // Using type assertion to assure TypeScript that note.creator is not null here
      const creator = note.creator as Record<string, any>;
      
      const hasErrorProperty = 
        typeof creator === 'object' && 
        'error' in creator;
      
      // Handle valid creator vs error object
      const isValidCreator = !hasErrorProperty;
      
      // Now we can safely extract properties with appropriate fallbacks
      const creatorDisplayName = isValidCreator && 
        'display_name' in creator &&
        creator.display_name
          ? creator.display_name 
          : "Unknown User";
        
      const creatorEmail = isValidCreator && 
        'email' in creator &&
        creator.email
          ? creator.email 
          : "unknown@example.com";
      
      // Create the creator object based on our checks
      const safeCreator = {
        id: isValidCreator && 'id' in creator ? creator.id : note.created_by,
        display_name: creatorDisplayName,
        email: creatorEmail
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
        creator: safeCreator
      } as WorkNote;
    });
    
    return processedNotes;
  } catch (error) {
    console.error('Error in getWorkNotes:', error);
    throw error;
  }
}
