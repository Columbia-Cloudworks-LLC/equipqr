
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
    
    // Get user info for permissions check
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    // Get the equipment details to check organization
    const { data: equipment } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        team_id,
        team:team_id (
          name,
          org_id
        )
      `)
      .eq('id', equipmentId)
      .single();
    
    if (!equipment) {
      throw new Error('Equipment not found');
    }
    
    // Check if user is directly in the equipment's organization
    const isInSameOrg = userProfile.org_id === equipment.org_id;
    
    // Check if user has technician or above role in the organization
    let isTechnician = false;
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);
    
    if (userRoles && userRoles.length > 0) {
      const role = userRoles[0].role;
      isTechnician = ['technician', 'manager', 'admin', 'owner'].includes(role);
    }
    
    // Get all notes with user details and edit history
    const { data: notes, error } = await supabase
      .from('equipment_work_notes')
      .select(`
        *,
        creator:created_by (
          display_name
        ),
        editor:edited_by (
          display_name
        )
      `)
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }

    // Filter notes based on access level
    return notes.map(note => {
      // Enrich note with additional context
      const isExternalOrg = equipment.team && 
                           equipment.team.org_id !== userProfile.org_id;
      
      return {
        ...note,
        is_external_org: isExternalOrg,
        organization_name: isExternalOrg ? equipment.org_id : null,
        team_name: equipment.team?.name || null
      };
    }).filter(note => {
      // For technicians and higher, return all notes
      if (isTechnician) return true;
      
      // For regular viewers, only return public notes
      return note.is_public;
    });
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
    const { data, error } = await supabase.rpc(
      'get_work_note_organizations',
      { equipment_id: equipmentId }
    );
    
    if (error) {
      console.error('Error fetching work note organizations:', error);
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getWorkNoteOrganizations:', error);
    return [];
  }
}
