
/**
 * Interface defining the result of team access validation
 */
export interface TeamAccessResult {
  is_member: boolean;
  has_access: boolean;
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
  user_org_id?: string | null;
  team_org_id?: string | null;
  team_name?: string | null;
  error?: string;
}
