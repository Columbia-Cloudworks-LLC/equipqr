
/**
 * Types related to team access validation
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

export interface TeamAccessDetails {
  hasAccess: boolean;
  role: string | null;
  isMember: boolean;
  hasOrgAccess: boolean;
  orgRole: string | null;
  accessReason: string | null;
  hasCrossOrgAccess: boolean;
  orgName: string | null;
  team: any;
  teamMemberId?: string | null;  // Added this property
  error?: string | null;
}

export interface RepairResult {
  success: boolean;
  team_member_id?: string;
  error?: string;
}
