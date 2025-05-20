
export interface WorkNote {
  id: string;
  equipment_id: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  note: string;
  created_by: string;
  is_public: boolean;
  hours_worked: number | null;
  organization_id?: string;
  organization_name?: string;
  is_external_org?: boolean;
  team_name?: string;
  team_id?: string;
  created_by_name?: string;
  created_by_email?: string;
  creator?: {
    id: string;
    display_name: string;
    email?: string;
    org?: {
      id: string;
      name: string;
    }
  };
}

export interface WorkNotePermissions {
  canCreate: boolean;
  canManage: boolean;
  canDelete: boolean;
  reason?: string;
}
