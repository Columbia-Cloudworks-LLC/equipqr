
// Create this file to export the Team type

export interface Team {
  id: string;
  name: string;
  org_id: string;
  org_name?: string;
  is_external?: boolean;
  role?: string;
  has_access?: boolean;
  created_at?: string;
  deleted_at?: string | null;
  members?: any[];
}
