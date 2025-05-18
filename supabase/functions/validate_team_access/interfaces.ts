
/**
 * Interface for team access results
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

/**
 * Interface for initial access check result
 */
export interface InitialAccessResult {
  is_member: boolean;
  has_org_access?: boolean;
  access_reason?: string;
}

/**
 * Interface for team data
 */
export interface TeamData {
  name: string;
  org_id: string;
}
