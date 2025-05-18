
import { UserRole } from "@/types/supabase-enums";

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
  org_id: string;
  organization?: {
    name: string;
  };
}
