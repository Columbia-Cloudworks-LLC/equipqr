
import { UserRole } from "@/types/supabase-enums";

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
  org_id: string;
  created_by?: string; // Make this optional
  organization?: {
    name: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  invitation?: OrganizationInvitation;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  message?: string; // Add this property
  data?: any;
}

export interface EmailInvitationOptions {
  recipientEmail: string;
  organizationName: string;
  inviterEmail: string;
  token: string;
  role: UserRole;
  action?: string;
}
