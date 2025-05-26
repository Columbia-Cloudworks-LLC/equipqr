
import { supabase } from '@/integrations/supabase/client';

export interface ImageUploadResult {
  url: string;
  fileName: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'work-note-images';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload multiple images to Supabase storage
   */
  static async uploadImages(files: File[]): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadSingleImage(file);
        results.push(result);
      } catch (error) {
        console.error('Error uploading image:', error);
        results.push({
          url: '',
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }
    
    return results;
  }

  /**
   * Upload a single image to Supabase storage
   */
  private static async uploadSingleImage(file: File): Promise<ImageUploadResult> {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of 50MB`);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('You must be logged in to upload images');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      fileName: data.path
    };
  }

  /**
   * Delete an image from Supabase storage
   */
  static async deleteImage(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for an image
   */
  static getImageUrl(fileName: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }
}
