
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

export interface MembershipDetails {
  teamMemberId: string | null;
  hasCrossOrgAccess: boolean;
}

export interface TeamData {
  name: string;
  org_id: string;
}

export interface TeamDetails {
  teamData: TeamData | null;
  orgName: string | null;
}
