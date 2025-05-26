
export interface WorkNote {
  id?: string;
  equipment_id: string;
  note: string;
  created_by: string;
  created_at?: string;
  hours_worked?: number | null;
  is_public: boolean;
  updated_at?: string;
  deleted_at?: string | null;
  edited_at?: string | null;
  edited_by?: string | null;
  work_order_id?: string | null;
  creator?: {
    display_name?: string;
  };
  editor?: {
    display_name?: string;
  };
  is_external_org?: boolean;
  organization_name?: string;
  team_name?: string;
}

export interface WorkNotePermissions {
  canCreate: boolean;
  canManage: boolean;
  canDelete: boolean;
  reason?: string;
}
