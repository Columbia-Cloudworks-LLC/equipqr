
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
  install_date?: string;
  warranty_expiration?: string;
  maintenance_date?: string;
  notes?: string;
  org_id: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Additional fields used in components
  org_name?: string;
  team_name?: string;
  is_external_org?: boolean;
  attributes?: EquipmentAttribute[];
  created_by: string;
  // Adding missing properties
  can_edit?: boolean;
  has_no_team?: boolean;
}

export interface EquipmentAttribute {
  id?: string;
  equipment_id: string;
  key: string;
  value?: string | null;
  created_at?: string;
  updated_at?: string;
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
  attributes?: EquipmentAttribute[];
}

export interface EquipmentFormValues {
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
  attributes?: EquipmentAttribute[];
}

export interface CreateEquipmentParams {
  equipment: EquipmentFormValues;
  userId: string;
  orgId: string;
}

export interface WorkNote {
  id: string;
  equipment_id: string;
  work_order_id?: string;
  created_by: string;
  note: string;
  content?: string;
  author?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  hours_worked?: number;
  is_public: boolean;
}
