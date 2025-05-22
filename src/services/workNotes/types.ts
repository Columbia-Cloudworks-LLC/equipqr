
/**
 * Interface for equipment work notes
 */
export interface WorkNote {
  id: string;
  equipment_id: string;
  work_order_id?: string;
  created_by: string;
  note: string;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  is_public: boolean;
  hours_worked?: number;
  
  // Author information
  author?: string;
  content?: string;
  created_by_name?: string;
  created_by_email?: string;
  
  // Organization and team information
  organization_id?: string;
  organization_name?: string;
  is_external_org?: boolean;
  team_id?: string;
  team_name?: string;
  
  // Creator object (for joined queries)
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

/**
 * Interface for work note permissions
 */
export interface WorkNotePermissions {
  canCreate: boolean;
  canManage: boolean;
  canDelete: boolean;
  reason?: string;
}
