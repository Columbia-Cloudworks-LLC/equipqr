
/**
 * Team access validation response types
 */

export interface TeamAccessResult {
  is_member: boolean;
  has_org_access?: boolean;
  has_cross_org_access?: boolean;
  team_member_id?: string | null;
  access_reason?: string;
  role?: string | null;
  team?: {
    name: string;
    org_id: string;
  } | null;
  org_name?: string | null;
  error?: string | null;
}

export interface TeamAccessDetailedResult {
  has_access: boolean;
  access_reason: string;
  user_org_id: string;
  team_org_id: string;
  is_team_member: boolean;
  is_org_owner: boolean;
  team_role: string;
  error?: string | null;
}

export interface TeamValidationResult {
  isValid: boolean;
  result: TeamAccessResult | null;
  error?: string;
}
