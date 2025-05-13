
import { supabase } from "@/integrations/supabase/client";
import { canManageWorkNotes } from "./permissionService";

export type WorkNote = {
  id: string;
  equipment_id: string;
  note: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
  hours_worked: number | null;
  user_name?: string;
  organization_id?: string;
  organization_name?: string;
  is_external_org?: boolean;
};

/**
 * Get work notes for a specific equipment
 * @param equipmentId The equipment ID
 * @returns An array of work notes
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    if (!equipmentId) {
      throw new Error('Equipment ID is required');
    }
    
    // Check current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to view work notes');
    }
    
    // Get user's organization ID for determining external notes
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', sessionData.session.user.id)
      .single();
      
    const userOrgId = userProfile?.org_id;
    
    // Get the work notes
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select(`
        *,
        creator:created_by (
          id,
          display_name,
          org:user_profiles(org_id, organization(name))
        )
      `)
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching work notes:', error);
      throw new Error(`Failed to fetch work notes: ${error.message}`);
    }
    
    // Process the notes to add creator info and organization info
    return (data || []).map(note => {
      const creatorName = note.creator?.display_name || 'Unknown';
      const organizationId = note.creator?.org?.[0]?.org_id;
      const organizationName = note.creator?.org?.[0]?.organization?.name || 'Unknown Organization';
      const isExternalOrg = organizationId && userOrgId && organizationId !== userOrgId;
      
      return {
        id: note.id,
        equipment_id: note.equipment_id,
        note: note.note,
        is_public: note.is_public,
        created_at: note.created_at,
        created_by: note.created_by,
        hours_worked: note.hours_worked,
        user_name: creatorName,
        organization_id: organizationId,
        organization_name: organizationName,
        is_external_org: isExternalOrg
      };
    });
  } catch (error: any) {
    console.error('Error in getWorkNotes:', error);
    throw error;
  }
}

/**
 * Create a new work note
 * @param equipmentId The equipment ID
 * @param note The note text
 * @param hoursWorked Optional hours worked
 * @param isPublic Whether the note is public
 * @returns The created work note
 */
export async function createWorkNote(
  equipmentId: string,
  note: string,
  hoursWorked?: number | null,
  isPublic: boolean = false
): Promise<WorkNote> {
  try {
    if (!equipmentId) {
      throw new Error('Equipment ID is required');
    }
    
    if (!note || note.trim() === '') {
      throw new Error('Note content is required');
    }
    
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to create work notes');
    }
    
    // Insert the work note - work notes are IMMUTABLE once created
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: equipmentId,
        note: note.trim(),
        hours_worked: hoursWorked,
        is_public: isPublic,
        created_by: sessionData.session.user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating work note:', error);
      throw new Error(`Failed to create work note: ${error.message}`);
    }
    
    return data as WorkNote;
  } catch (error: any) {
    console.error('Error in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update a work note - only allowed for managers and administrators
 * and only for specific fields (is_public, hours_worked)
 * The note text itself is IMMUTABLE
 * @param id The work note ID
 * @param updates The updates to apply
 * @returns The updated work note
 */
export async function updateWorkNote(id: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    if (!id) {
      throw new Error('Work note ID is required');
    }
    
    // First, get the work note to check its equipment ID
    const { data: workNote, error: fetchError } = await supabase
      .from('equipment_work_notes')
      .select('equipment_id, note')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching work note for update:', fetchError);
      throw new Error(`Failed to fetch work note: ${fetchError.message}`);
    }
    
    // Check if user has permission to manage work notes
    const canManage = await canManageWorkNotes(workNote.equipment_id);
    if (!canManage) {
      throw new Error('You do not have permission to update this work note');
    }
    
    // Prepare updates - ONLY allow updating visibility and hours worked
    // The note text itself is IMMUTABLE
    const allowedUpdates: Partial<WorkNote> = {};
    
    if (updates.is_public !== undefined) {
      allowedUpdates.is_public = updates.is_public;
    }
    
    if (updates.hours_worked !== undefined) {
      allowedUpdates.hours_worked = updates.hours_worked;
    }
    
    // Apply the updates
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating work note:', error);
      throw new Error(`Failed to update work note: ${error.message}`);
    }
    
    return data as WorkNote;
  } catch (error: any) {
    console.error('Error in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Soft delete a work note - only allowed for managers and administrators
 * @param id The work note ID
 * @returns A boolean indicating success
 */
export async function deleteWorkNote(id: string): Promise<boolean> {
  try {
    if (!id) {
      throw new Error('Work note ID is required');
    }
    
    // First, get the work note to check its equipment ID
    const { data: workNote, error: fetchError } = await supabase
      .from('equipment_work_notes')
      .select('equipment_id')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching work note for deletion:', fetchError);
      throw new Error(`Failed to fetch work note: ${fetchError.message}`);
    }
    
    // Check if user has permission to manage work notes
    const canManage = await canManageWorkNotes(workNote.equipment_id);
    if (!canManage) {
      throw new Error('You do not have permission to delete this work note');
    }
    
    // Soft delete the work note
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting work note:', error);
      throw new Error(`Failed to delete work note: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in deleteWorkNote:', error);
    throw error;
  }
}

// Re-export the permission service functions
export { canCreateWorkNotes, canManageWorkNotes } from './permissionService';
