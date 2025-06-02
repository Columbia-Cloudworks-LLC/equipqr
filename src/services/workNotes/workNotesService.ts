
import { supabase } from '@/integrations/supabase/client';
import { WorkNote } from '@/types/workNotes';
import { canViewWorkOrders } from '@/services/workOrders/workOrderPermissions';

/**
 * Get work notes for equipment with proper permission checking
 */
export async function getWorkNotes(equipmentId: string): Promise<WorkNote[]> {
  try {
    console.log('Fetching work notes for equipment:', equipmentId);
    
    // Check if user has permission to view work notes for this equipment
    const hasPermission = await canViewWorkOrders(equipmentId);
    console.log('User has permission to view work notes:', hasPermission);
    
    if (!hasPermission) {
      console.warn('User does not have permission to view work notes for equipment:', equipmentId);
      return [];
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('No authenticated user found');
      throw new Error('User must be logged in to view work notes');
    }

    console.log('Authenticated user ID:', user.user.id);

    // Fetch work notes with proper joins for user information
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select(`
        *,
        creator:created_by(display_name, email),
        editor:edited_by(display_name, email)
      `)
      .eq('equipment_id', equipmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work notes:', error);
      throw error;
    }

    console.log('Raw work notes data from database:', data);

    if (!data || data.length === 0) {
      console.log('No work notes found for equipment:', equipmentId);
      return [];
    }

    // Transform the data to match our WorkNote interface
    const workNotes: WorkNote[] = data.map(note => ({
      id: note.id,
      equipment_id: note.equipment_id,
      note: note.note,
      created_by: note.created_by,
      created_at: note.created_at,
      updated_at: note.updated_at,
      work_order_id: note.work_order_id,
      edited_by: note.edited_by,
      edited_at: note.edited_at,
      image_urls: note.image_urls || [],
      hours_worked: note.hours_worked,
      is_public: note.is_public || false,
      creator_name: note.creator?.display_name || note.creator?.email || 'Unknown User',
      editor_name: note.editor?.display_name || note.editor?.email || null
    }));

    console.log('Transformed work notes:', workNotes);
    return workNotes;
  } catch (error) {
    console.error('Error in getWorkNotes:', error);
    throw error;
  }
}

/**
 * Create a new work note
 */
export async function createWorkNote(params: {
  equipment_id: string;
  note: string;
  is_public?: boolean;
  hours_worked?: number;
  work_order_id?: string;
  image_urls?: string[];
}): Promise<WorkNote> {
  try {
    console.log('Creating work note with params:', params);
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User must be logged in to create work notes');
    }

    // Check permission to submit work orders/notes for this equipment
    const hasPermission = await canViewWorkOrders(params.equipment_id);
    if (!hasPermission) {
      throw new Error('You do not have permission to create work notes for this equipment');
    }

    const noteData = {
      equipment_id: params.equipment_id,
      note: params.note,
      created_by: user.user.id,
      is_public: params.is_public || false,
      hours_worked: params.hours_worked || null,
      work_order_id: params.work_order_id || null,
      image_urls: params.image_urls || []
    };

    console.log('Inserting work note data:', noteData);

    const { data, error } = await supabase
      .from('equipment_work_notes')
      .insert(noteData)
      .select(`
        *,
        creator:created_by(display_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating work note:', error);
      throw error;
    }

    console.log('Created work note:', data);

    return {
      id: data.id,
      equipment_id: data.equipment_id,
      note: data.note,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      work_order_id: data.work_order_id,
      edited_by: data.edited_by,
      edited_at: data.edited_at,
      image_urls: data.image_urls || [],
      hours_worked: data.hours_worked,
      is_public: data.is_public || false,
      creator_name: data.creator?.display_name || data.creator?.email || 'Unknown User',
      editor_name: null
    };
  } catch (error) {
    console.error('Error in createWorkNote:', error);
    throw error;
  }
}

/**
 * Update an existing work note
 */
export async function updateWorkNote(
  id: string,
  params: {
    note?: string;
    is_public?: boolean;
    hours_worked?: number;
    image_urls?: string[];
  }
): Promise<WorkNote> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User must be logged in to update work notes');
    }

    const updateData = {
      ...params,
      edited_by: user.user.id,
      edited_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('equipment_work_notes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:created_by(display_name, email),
        editor:edited_by(display_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating work note:', error);
      throw error;
    }

    return {
      id: data.id,
      equipment_id: data.equipment_id,
      note: data.note,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      work_order_id: data.work_order_id,
      edited_by: data.edited_by,
      edited_at: data.edited_at,
      image_urls: data.image_urls || [],
      hours_worked: data.hours_worked,
      is_public: data.is_public || false,
      creator_name: data.creator?.display_name || data.creator?.email || 'Unknown User',
      editor_name: data.editor?.display_name || data.editor?.email || null
    };
  } catch (error) {
    console.error('Error in updateWorkNote:', error);
    throw error;
  }
}

/**
 * Delete a work note
 */
export async function deleteWorkNote(id: string): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User must be logged in to delete work notes');
    }

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('equipment_work_notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting work note:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteWorkNote:', error);
    throw error;
  }
}
