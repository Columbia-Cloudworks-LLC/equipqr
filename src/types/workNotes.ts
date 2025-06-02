
export interface WorkNote {
  id: string;
  equipment_id: string;
  note: string;
  is_public: boolean;
  hours_worked: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  edited_at: string | null;
  edited_by: string | null;
  work_order_id: string | null;
  image_urls: string[] | null;
  
  // Extended fields from joins
  creator_name?: string;
  creator_org_name?: string;
  organization_name?: string;
  is_external_org?: boolean;
  
  // Creator object for compatibility
  creator?: {
    display_name: string;
  };
}

export interface WorkNotePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewPrivate: boolean;
}
