
// Create equipment types that are missing

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  status: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration?: string;
  maintenance_date?: string;
  notes?: string;
  org_id: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface EquipmentCreateData {
  name: string;
  description?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  status: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration?: string;
  maintenance_date?: string;
  notes?: string;
  team_id?: string;
  org_id: string;
}
