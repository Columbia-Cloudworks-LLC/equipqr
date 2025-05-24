
export interface TeamAccessResult {
  is_member: boolean;
  has_access: boolean;
  access_reason: string;
  user_org_id?: string;
  team_org_id?: string;
  role?: string;
  has_cross_org_access?: boolean;
  has_org_access?: boolean;
  org_role?: string;
  org_name?: string;
  team_name?: string;
  team?: {
    id: string;
    name: string;
    org_id: string;
  } | null;
}

export interface TeamValidationResult {
  isValid: boolean;
  result: TeamAccessResult;
  diagnostics?: any;
  error?: string;
}

export interface RepairResult {
  success: boolean;
  team_member_id?: string;
  error?: string;
}
