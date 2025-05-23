
export interface InvitationDetails {
  id: string;
  email: string;
  status: string;
  created_at: string;
  team?: {
    id: string;
    name: string;
    org_id?: string;
  };
  team_id?: string;
  role: string;
  org_id?: string;
  organization?: {
    name: string;
    id?: string;
  };
  token?: string;
}

export type InvitationType = 'team' | 'organization';

export interface AcceptanceResult {
  success: boolean;
  error?: string;
  organizationId?: string;
  organizationName?: string;
  teamId?: string;
  teamName?: string;
  role?: string;
  entityName?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  invitation?: InvitationDetails;
}
