
import { EquipmentStatus } from "./supabase-enums";

export interface Equipment {
  id: string;
  name: string;
  org_id: string;
  team_id?: string | null;
  status: EquipmentStatus;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  asset_id?: string;
  notes?: string;
  install_date?: string | null;
  warranty_expiration?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by: string;
  attributes?: EquipmentAttribute[];
  can_edit?: boolean;
  has_no_team?: boolean;
  team_name?: string;
  org_name?: string;
  is_external_org?: boolean;
  description?: string;
  purchase_date?: string;
  maintenance_date?: string;
  // Location fields
  location_address?: string;
  location_coordinates?: string;
  last_scan_latitude?: number | null;
  last_scan_longitude?: number | null;
  last_scan_accuracy?: number | null;
  last_scan_timestamp?: string | null;
  last_scan_by_user_id?: string | null;
  location_override?: boolean;
  location_source?: string;
}

export interface EquipmentAttribute {
  id: string;
  equipment_id: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkNote {
  id: string;
  equipment_id: string;
  work_order_id?: string;
  created_by: string;
  note: string;
  created_at: string;
  is_public: boolean;
  hours_worked?: number;
  author?: string;
  content?: string;
}

export interface EquipmentFormValues {
  name: string;
  org_id: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  status?: string;
  location?: string;
  purchase_date?: string;
  install_date?: string | null;
  warranty_expiration?: string | null;
  notes?: string;
  team_id?: string | null;
  attributes?: EquipmentAttribute[];
  description?: string;
  maintenance_date?: string;
}

export type CreateEquipmentParams = Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'can_edit' | 'has_no_team' | 'team_name' | 'org_name' | 'is_external_org'> & {
  created_by: string;
};
