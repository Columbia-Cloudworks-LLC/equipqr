export interface TeamMember {
  id: string;
  auth_uid?: string; // Added this property
  display_name: string;
  email: string;
  role: string;
  pending_invite?: boolean;
  last_login?: string;
}
