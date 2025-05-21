
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  auth_uid?: string; // Add auth_uid property
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  team_id?: string;
  org_id?: string;
  team_name?: string;
  org_name?: string;
  invitationType?: 'team' | 'organization';
  token: string;
  team?: {
    id: string;
    name: string;
    org_id: string;
    created_by: string;
    created_at: string;
    deleted_at?: string | null;
  } | null;
  organization?: {
    id: string;
    name: string;
    created_at: string;
  } | null;
}

// Add the DashboardStat interface
export interface DashboardStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: number;
}

// Re-export all types
export * from './equipment';
export * from './supabase-enums';
export * from './notifications';
