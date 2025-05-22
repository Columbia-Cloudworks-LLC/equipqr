
import { Team } from '@/services/team';

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_active?: boolean;
  status?: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
  is_primary?: boolean;
  created_at?: string;
  user_id?: string;
  // Added to match UserOrganization interface
  owner_user_id?: string;
  updated_at?: string;
}

// Equipment related types
export interface Equipment {
  id: string;
  name: string;
  org_id: string;
  team_id?: string | null;
  status: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
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

export interface CreateEquipmentParams {
  name: string;
  org_id: string;
  team_id?: string | null;
  status?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  notes?: string;
  install_date?: string | null;
  warranty_expiration?: string | null;
  attributes?: EquipmentAttribute[];
  description?: string;
  purchase_date?: string;
  maintenance_date?: string;
  created_by?: string;
}

// Dashboard related types
export interface DashboardStat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
}

// Invitation type
export interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  team?: {
    id: string;
    name: string;
    org_id: string;
    created_by: string;
    created_at: string;
    deleted_at: string | null;
  };
  team_id?: string;
  role: string;
  org_id?: string;
  organization?: {
    id: string;
    name: string;
    created_at: string;
  };
  invitationType?: 'team' | 'organization';
  token?: string;
  team_name?: string;  // Add missing property
  org_name?: string;   // Add missing property
}

// Re-export Team type for consistency
export type { Team };
