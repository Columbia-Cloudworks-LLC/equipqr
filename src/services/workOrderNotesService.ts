
import { supabase } from '@/integrations/supabase/client';

export interface WorkOrderNote {
  id: string;
  work_order_id: string;
  author_id: string;
  content: string;
  hours_worked: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  images?: WorkOrderNoteImage[];
}

export interface WorkOrderNoteImage {
  id: string;
  work_order_id: string;
  note_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
  uploaded_by_name?: string;
}

// Create a note with images
export const createWorkOrderNoteWithImages = async (
  workOrderId: string,
  content: string,
  hoursWorked: number = 0,
  isPrivate: boolean = false,
  images: File[] = []
): Promise<WorkOrderNote> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  // Create the note first
  const { data: note, error: noteError } = await supabase
    .from('work_order_notes')
    .insert({
      work_order_id: workOrderId,
      author_id: userData.user.id,
      content,
      hours_worked: hoursWorked,
      is_private: isPrivate
    })
    .select()
    .single();

  if (noteError) throw noteError;

  // Upload images if provided
  const uploadedImages: WorkOrderNoteImage[] = [];
  for (const file of images) {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${workOrderId}/${note.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('work-order-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Failed to upload image:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-order-images')
        .getPublicUrl(uploadData.path);

      // Save image record to database
      const { data: imageRecord, error: imageError } = await supabase
        .from('work_order_images')
        .insert({
          work_order_id: workOrderId,
          note_id: note.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userData.user.id
        })
        .select()
        .single();

      if (imageError) {
        console.error('Failed to save image record:', imageError);
        continue;
      }

      uploadedImages.push(imageRecord);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }

  return {
    ...note,
    images: uploadedImages
  };
};

// Get notes with images for work order
export const getWorkOrderNotesWithImages = async (workOrderId: string): Promise<WorkOrderNote[]> => {
  const { data, error } = await supabase
    .from('work_order_notes')
    .select(`
      *,
      profiles:author_id (
        name
      )
    `)
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get images for each note
  const notes = await Promise.all((data || []).map(async (note) => {
    const { data: images } = await supabase
      .from('work_order_images')
      .select(`
        *,
        profiles:uploaded_by (
          name
        )
      `)
      .eq('note_id', note.id)
      .order('created_at', { ascending: false });

    return {
      ...note,
      author_name: (note.profiles as any)?.name || 'Unknown',
      images: (images || []).map((img: any) => ({
        ...img,
        uploaded_by_name: img.profiles?.name || 'Unknown'
      }))
    };
  }));

  return notes;
};

// Get all images for work order (for gallery view)
export const getWorkOrderImages = async (workOrderId: string) => {
  const { data, error } = await supabase
    .from('work_order_images')
    .select(`
      *,
      work_order_notes (
        content,
        author_id,
        is_private,
        profiles:author_id (
          name
        )
      ),
      profiles:uploaded_by (
        name
      )
    `)
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(image => ({
    ...image,
    uploaded_by_name: (image.profiles as any)?.name || 'Unknown',
    note_content: (image.work_order_notes as any)?.content,
    note_author_name: (image.work_order_notes as any)?.profiles?.name || 'Unknown',
    is_private_note: (image.work_order_notes as any)?.is_private
  }));
};

// Delete an image
export const deleteWorkOrderImage = async (imageId: string): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  // Get image details first
  const { data: image, error: fetchError } = await supabase
    .from('work_order_images')
    .select('file_url, uploaded_by')
    .eq('id', imageId)
    .single();

  if (fetchError) throw fetchError;
  if (!image) throw new Error('Image not found');

  // Check if user can delete (must be uploader)
  if (image.uploaded_by !== userData.user.id) {
    throw new Error('Not authorized to delete this image');
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('work_order_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) throw deleteError;

  // Delete from storage
  const filePath = image.file_url.split('/').slice(-4).join('/'); // Extract path from URL
  await supabase.storage
    .from('work-order-images')
    .remove([filePath]);
};
