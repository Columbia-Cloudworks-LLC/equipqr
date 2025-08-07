export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  team_id: string;
  organization_id: string;
  joined_at?: string;
  skills?: string[];
  profiles?: {
    name: string;
    email: string;
  } | null;
}

export interface TeamMemberFormData {
  name: string;
  email: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  skills?: string[];
}

export interface TeamData {
  id?: string;
  name: string;
  description: string;
  organization_id: string;
  specializations?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TeamWithMembers extends TeamData {
  members: TeamMember[];
  activeWorkOrders?: number;
}