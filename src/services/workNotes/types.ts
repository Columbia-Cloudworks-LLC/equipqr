
import { UserRole } from '@/types/supabase-enums';

/**
 * Interface for work notes with extra information
 */
export interface WorkNote {
  id: string;
  equipment_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
  hours_worked: number | null;
  organization_name?: string;
  organization_id?: string;
  user_name?: string;
  is_external_org?: boolean;
  deleted_at?: string | null;
  team_name?: string;
  creator?: {
    id?: string;
    display_name?: string;
    org?: {
      id?: string;
      name?: string;
    };
  };
}

/**
 * User permission levels for work notes
 */
export interface WorkNotePermissions {
  canCreate: boolean;
  canManage: boolean;
  canDelete: boolean;
  reason?: string;
  role?: UserRole;
}

/**
 * Filter options for work notes
 */
export interface WorkNoteFilters {
  isPublic?: boolean;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
}
