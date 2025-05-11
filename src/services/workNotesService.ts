
import { supabase } from '@/integrations/supabase/client';
import { getAppUserId } from '@/utils/authUtils';

export interface WorkNote {
  id?: string;
  equipment_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  note: string;
  is_public: boolean;
  hours_worked?: number;
  deleted_at?: string | null;
  creator?: {
    display_name?: string;
    email?: string;
  };
}

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

/**
 * Create a new work note
 */
export async function createWorkNote(workNote: WorkNote): Promise<WorkNote> {
  try {
    // Get current auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      throw new Error('User must be logged in to create work notes');
    }

    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(sessionData.session.user.id);

    // Create the note
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert({
        equipment_id: workNote.equipment_id,
        created_by: appUserId,
        note: workNote.note,
        is_public: workNote.is_public,
        hours_worked: workNote.hours_worked || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work note:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(id: string, updates: Partial<WorkNote>): Promise<WorkNote> {
  try {
    // Only managers can update notes (enforced by RLS)
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update({
        note: updates.note,
        is_public: updates.is_public,
        hours_worked: updates.hours_worked,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work note:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Soft delete a work note
 */
export async function deleteWorkNote(id: string): Promise<boolean> {
  try {
    // Only managers can delete notes (enforced by RLS)
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting work note:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkNote:', error);
    throw error;
  }
}

/**
 * Check if the current user can edit work notes
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get the equipment details including team_id
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError) {
      console.error('Error fetching equipment details:', equipmentError);
      return false;
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;

    // Check if user is org owner/manager
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);

    if (!rolesError && userRoles?.some(ur => ['owner', 'manager'].includes(ur.role))) {
      return true;
    }

    // If it's a team equipment, check team role
    if (equipment.team_id) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();

      if (appUser) {
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();

        if (teamMember) {
          const { data: teamRoles } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id);

          if (teamRoles?.some(tr => tr.role === 'manager')) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking work note permissions:', error);
    return false;
  }
}

/**
 * Check if the current user can create work notes (managers and technicians)
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get the equipment details including team_id
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError) {
      console.error('Error fetching equipment details:', equipmentError);
      return false;
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;

    // Check if user is org owner/manager
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);

    if (!rolesError && userRoles?.some(ur => ['owner', 'manager'].includes(ur.role))) {
      return true;
    }

    // If it's a team equipment, check team role
    if (equipment.team_id) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();

      if (appUser) {
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();

        if (teamMember) {
          const { data: teamRoles } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id);

          if (teamRoles?.some(tr => ['manager', 'technician'].includes(tr.role))) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking work note creation permissions:', error);
    return false;
  }
}
