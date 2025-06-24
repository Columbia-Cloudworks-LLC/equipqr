
// Equipment Notes Types
export interface EquipmentNote {
  id: string;
  equipment_id: string;
  content: string;
  author_id: string;
  is_private: boolean;
  hours_worked?: number;
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
  last_modified_at?: string;
  // Derived fields
  authorName?: string;
  lastModifiedByName?: string;
  images?: EquipmentNoteImage[];
}

export interface EquipmentNoteImage {
  id: string;
  equipment_note_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
  // Derived fields
  uploadedByName?: string;
}

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
