export interface ImageUploadResult {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface EquipmentImage {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  equipment_id: string;
  note_id?: string;
  is_private_note?: boolean;
}

export interface EquipmentNote {
  id: string;
  content: string;
  hours_worked: number;
  is_private: boolean;
  created_at: string;
  author_name: string;
  equipment_id: string;
  organization_id: string;
  images?: EquipmentImage[];
}

export interface ImageGalleryItem {
  id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
  is_private_note?: boolean;
}