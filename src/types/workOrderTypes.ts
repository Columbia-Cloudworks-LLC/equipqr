// Work order specific types
export interface WorkOrderImage {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  is_private_note?: boolean;
}

export interface PMChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  checked?: boolean;
  required: boolean;
  order: number;
  category?: string;
}

export interface ImageData {
  id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
}

export interface WorkOrderNote {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  hours_worked: number;
  is_private: boolean;
  images?: WorkOrderImage[];
}

export interface ExtendedWorkOrderProps {
  equipmentTeamName?: string;
  equipmentId: string;
  organizationId: string;
  assigneeName?: string;
  createdByName?: string;
  equipmentName?: string;
}