
/**
 * Core types for the application
 */

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
}
