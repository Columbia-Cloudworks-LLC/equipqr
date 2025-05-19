
/**
 * Type definitions for team validation functionality
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
}

export interface TeamAccessDetailedResult {
  has_access: boolean;
  access_reason: string;
  user_org_id: string;
  team_org_id: string;
  is_team_member: boolean;
  is_org_owner: boolean;
  team_role: string;
}

export interface TeamRepairResult {
  success: boolean;
  team_member_id?: string;
  error?: string;
}

export interface TeamMembershipResponse {
  isValid: boolean;
  result: any;
  error?: string;
}

export interface TeamAccessDetailsResponse {
  isMember: boolean;
  hasOrgAccess: boolean;
  hasCrossOrgAccess: boolean;
  teamMemberId: string | null;
  accessReason: string | null;
  role: string | null;
  team: any | null;
  orgName: string | null;
  error?: string | null;
}
