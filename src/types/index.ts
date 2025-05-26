
import { Team } from '@/services/team';
import { Equipment, EquipmentAttribute } from './equipment';

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
  auth_uid?: string;
  joined_at?: string;
  // Properties for org managers and hierarchy
  org_role?: string;
  is_org_manager?: boolean;
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
  expires_at?: string; // Add the missing expires_at property
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
  team_name?: string;
  org_name?: string;
}

// Re-export Team type for consistency
export type { Team };

// Export equipment types (without redefinition)
export type { Equipment, EquipmentAttribute } from './equipment';
export type { CreateEquipmentParams } from './equipment';
