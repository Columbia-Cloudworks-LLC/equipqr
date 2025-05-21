
/**
 * Core types for the application
 */

import { Equipment, EquipmentAttribute, WorkNote } from './equipment';

// Re-export types from equipment.ts
export type { Equipment, EquipmentAttribute, WorkNote };

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  joined_at?: string;
  is_current_user?: boolean;
  auth_uid?: string; // Added for TeamMemberRow
  status?: string; // Added for TeamMemberRow
  // Add any other missing properties
  display_name?: string;
}

export interface DashboardStat {
  label: string;
  value: number;
  change?: number;
  icon: any;
}

export interface Invitation {
  id: string;
  email: string;
  status: string;
  role: string;
  token: string;
  created_at: string;
  accepted_at?: string;
  expires_at?: string;
  team_id?: string;
  team?: any;
  invitationType?: string;
  organization?: any;
  // Add missing properties
  org_name?: string;
  team_name?: string;
}
