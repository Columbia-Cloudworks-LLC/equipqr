
export interface OrganizationMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}
