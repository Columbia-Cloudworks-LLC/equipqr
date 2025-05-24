
export interface TeamAccessResult {
  is_member: boolean;
  has_access: boolean;
  access_reason: string;
  user_org_id?: string;
  team_org_id?: string;
  role?: string;
  has_cross_org_access?: boolean;
  has_org_access?: boolean;
  org_role?: string; // Add org_role to the interface
}

export interface TeamValidationResult {
  isValid: boolean;
  result: TeamAccessResult;
  diagnostics?: any;
  error?: string;
}
