
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type EquipmentNote = Tables<'equipment_notes'> & {
  authorName?: string;
  lastModifiedByName?: string;
  images?: EquipmentNoteImage[];
};

export type EquipmentNoteImage = Tables<'equipment_note_images'> & {
  uploadedByName?: string;
};

export interface CreateEquipmentNoteData {
  equipmentId: string;
  content: string;
  isPrivate: boolean;
  hoursWorked?: number;
}

export interface UpdateEquipmentNoteData {
  content?: string;
  isPrivate?: boolean;
  hoursWorked?: number;
}

// Get equipment notes with proper visibility filtering
export const getEquipmentNotes = async (
  equipmentId: string,
  organizationId: string
): Promise<EquipmentNote[]> => {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('equipment_notes')
      .select(`
        *,
        equipment!inner (
          organization_id,
          team_id
        ),
        equipment_note_images (
          *
        )
      `)
      .eq('equipment_id', equipmentId)
      .eq('equipment.organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching equipment notes:', error);
      return [];
    }

    // Get author and last modified profiles
    const authorIds = [...new Set((data || []).map(note => note.author_id))];
    const lastModifiedIds = [...new Set((data || []).map(note => note.last_modified_by).filter(Boolean))];
    const allUserIds = [...new Set([...authorIds, ...lastModifiedIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', allUserIds);

    // Transform the data
    return (data || []).map(note => ({
      ...note,
      authorName: profiles?.find(p => p.id === note.author_id)?.name || 'Unknown',
      lastModifiedByName: note.last_modified_by 
        ? profiles?.find(p => p.id === note.last_modified_by)?.name || 'Unknown'
        : undefined,
      images: note.equipment_note_images || []
    }));
  } catch (error) {
    console.error('Error in getEquipmentNotes:', error);
    return [];
  }
};

// Create a new equipment note
export const createEquipmentNote = async (
  noteData: CreateEquipmentNoteData
): Promise<EquipmentNote | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('equipment_notes')
      .insert({
        equipment_id: noteData.equipmentId,
        content: noteData.content,
        author_id: userData.user.id,
        is_private: noteData.isPrivate,
        hours_worked: noteData.hoursWorked || 0,
        last_modified_by: userData.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating equipment note:', error);
      return null;
    }

    // Get author profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userData.user.id)
      .single();

    return {
      ...data,
      authorName: profile?.name || 'Unknown',
      lastModifiedByName: profile?.name || 'Unknown',
      images: []
    };
  } catch (error) {
    console.error('Error in createEquipmentNote:', error);
    return null;
  }
};

// Update an equipment note
export const updateEquipmentNote = async (
  noteId: string,
  updateData: UpdateEquipmentNoteData
): Promise<EquipmentNote | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('equipment_notes')
      .update({
        ...updateData,
        last_modified_by: userData.user.id,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating equipment note:', error);
      return null;
    }

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', [data.author_id, userData.user.id]);

    return {
      ...data,
      authorName: profiles?.find(p => p.id === data.author_id)?.name || 'Unknown',
      lastModifiedByName: profiles?.find(p => p.id === userData.user.id)?.name || 'Unknown',
      images: []
    };
  } catch (error) {
    console.error('Error in updateEquipmentNote:', error);
    return null;
  }
};

// Delete an equipment note
export const deleteEquipmentNote = async (noteId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('equipment_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting equipment note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEquipmentNote:', error);
    return false;
  }
};

// Image management functions
export const uploadEquipmentNoteImage = async (
  noteId: string,
  file: File,
  description?: string
): Promise<EquipmentNoteImage | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${noteId}-${Date.now()}.${fileExt}`;
    const filePath = `equipment-notes/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-note-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('equipment-note-images')
      .getPublicUrl(filePath);

    // Create image record
    const { data, error } = await supabase
      .from('equipment_note_images')
      .insert({
        equipment_note_id: noteId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        description: description,
        uploaded_by: userData.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating image record:', error);
      return null;
    }

    // Get uploader profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userData.user.id)
      .single();

    return {
      ...data,
      uploadedByName: profile?.name || 'Unknown'
    };
  } catch (error) {
    console.error('Error in uploadEquipmentNoteImage:', error);
    return null;
  }
};

export const deleteEquipmentNoteImage = async (imageId: string): Promise<boolean> => {
  try {
    // Get image data first to delete from storage
    const { data: imageData, error: fetchError } = await supabase
      .from('equipment_note_images')
      .select('file_url')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      console.error('Error fetching image data:', fetchError);
      return false;
    }

    // Extract file path from URL
    const urlParts = imageData.file_url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('equipment-note-images')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete record from database
    const { error } = await supabase
      .from('equipment_note_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEquipmentNoteImage:', error);
    return false;
  }
};

// Set equipment display image
export const setEquipmentDisplayImage = async (
  equipmentId: string,
  imageUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('equipment')
      .update({ image_url: imageUrl })
      .eq('id', equipmentId);

    if (error) {
      console.error('Error setting display image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setEquipmentDisplayImage:', error);
    return false;
  }
};
