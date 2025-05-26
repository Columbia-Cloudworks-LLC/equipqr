
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
    
    // DETAILED LOGGING: Show what user IDs we found in the notes
    const userIds = [...new Set([
      ...notes?.map(note => note.created_by).filter(Boolean) || [],
      ...notes?.map(note => note.edited_by).filter(Boolean) || []
    ])];
    
    console.log('🔍 DEBUGGING: User IDs extracted from work notes:', {
      total_notes: notes?.length || 0,
      unique_user_ids: userIds,
      created_by_ids: notes?.map(note => ({ note_id: note.id, created_by: note.created_by })) || [],
      edited_by_ids: notes?.map(note => ({ note_id: note.id, edited_by: note.edited_by })).filter(n => n.edited_by) || []
    });
    
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
      console.log('🔍 DEBUGGING: Querying user_profiles table for user IDs:', userIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      console.log('🔍 DEBUGGING: User profiles query result:', {
        query_user_ids: userIds,
        profiles_returned: profiles,
        profiles_count: profiles?.length || 0,
        profiles_error: profilesError,
        individual_profiles: profiles?.map(p => ({ id: p.id, display_name: p.display_name })) || []
      });
      
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
      }
      
      userProfiles = profiles || [];
      
      // Check for missing profiles
      const foundUserIds = new Set(userProfiles.map(p => p.id));
      const missingUserIds = userIds.filter(id => !foundUserIds.has(id));
      
      if (missingUserIds.length > 0) {
        console.warn('🚨 DEBUGGING: Missing user profiles for these IDs:', missingUserIds);
        
        // Try to get more info about these missing users from auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsers?.users) {
          const missingAuthUsers = authUsers.users.filter(user => missingUserIds.includes(user.id));
          console.log('🔍 DEBUGGING: Found these missing users in auth.users:', 
            missingAuthUsers.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
          );
        }
      }
    }
    
    // Enrich notes with user information
    const enrichedNotes = notes?.map(note => {
      const creator = userProfiles.find(p => p.id === note.created_by);
      const editor = note.edited_by ? userProfiles.find(p => p.id === note.edited_by) : null;
      
      console.log(`🔍 DEBUGGING: Note ${note.id} user lookup:`, {
        created_by_id: note.created_by,
        creator_found: creator,
        creator_display_name: creator?.display_name || 'NOT FOUND',
        edited_by_id: note.edited_by,
        editor_found: editor,
        editor_display_name: editor?.display_name || (note.edited_by ? 'NOT FOUND' : 'N/A')
      });
      
      return {
        ...note,
        creator: {
          display_name: creator?.display_name || 'Unknown User'
        },
        editor: editor ? {
          display_name: editor.display_name || 'Unknown User'
        } : null
      };
    }) || [];
    
    console.log('🔍 DEBUGGING: Final enriched notes summary:', 
      enrichedNotes.map(note => ({
        note_id: note.id,
        creator_display_name: note.creator?.display_name,
        created_by_id: note.created_by
      }))
    );
    
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
