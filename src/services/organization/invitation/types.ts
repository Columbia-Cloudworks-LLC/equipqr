
import { UserRole } from '@/types/supabase-enums';

export interface EmailInvitationOptions {
  recipientEmail: string;
  organizationName: string;
  inviterEmail: string;
  token: string;
  role: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
  organization: {
    name: string;
  };
}

export interface InvitationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  invitation?: any;
  error?: string;
}
