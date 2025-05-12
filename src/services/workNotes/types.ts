
// Define the WorkNote type
export interface WorkNote {
  id?: string;
  equipment_id: string;
  created_by?: string;
  note: string;
  is_public: boolean;
  hours_worked?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  creator?: {
    display_name: string;
    email: string;
  };
  // Cross-organization fields
  organization_id?: string;
  organization_name?: string;
  team_id?: string;
  team_name?: string;
  is_external_org?: boolean;
}
