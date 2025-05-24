
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from './types';
import { checkAccessPermission } from '@/services/equipment/permissions/accessCheck';

/**
 * Fetch work notes for a specific piece of equipment with proper access control
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to view work notes');
    }
    
    console.log('Fetching work notes for equipment:', equipmentId);
    
    // Check user's permission level for this equipment
    const permissionResult = await checkAccessPermission(equipmentId);
    
    if (!permissionResult.hasPermission) {
      throw new Error('You do not have permission to view work notes for this equipment');
    }
    
    // Check if user has management permissions (can see private notes)
    const { data: managePermissionData, error: managePermissionError } = await supabase.functions.invoke('permissions', {
      body: {
        userId: userId,
        resource: 'equipment',
        action: 'edit',
        resourceId: equipmentId
      }
    });
    
    const canManageEquipment = !managePermissionError && managePermissionData?.has_permission;
    
    // Fetch work notes - filter based on permissions
    let query = supabase
      .from('equipment_work_notes')
      .select('*')
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    // If user cannot manage equipment, only show public notes
    if (!canManageEquipment) {
      console.log('User is viewer - filtering to public notes only');
      query = query.eq('is_public', true);
    } else {
      console.log('User has management permissions - showing all notes');
    }
    
    const { data: notes, error } = await query;
    
    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }
    
    console.log(`Found ${notes?.length || 0} work notes (filtered for permissions)`);
    
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
