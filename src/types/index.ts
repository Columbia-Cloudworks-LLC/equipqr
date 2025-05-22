
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
}

// Re-export Team type for consistency
export type { Team };
