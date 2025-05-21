
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
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
}

// Re-export all types
export * from './equipment';
export * from './supabase-enums';
export * from './notifications';
