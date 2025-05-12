export interface TeamMember {
  id: string;
  auth_uid?: string;
  display_name: string;
  email: string;
  role: string;
  pending_invite?: boolean;
  last_login?: string;
  // Additional properties used in the application
  user_id?: string;
  team_id?: string;
  status?: string;
  name?: string;
  joined_at?: string;
}

export interface Equipment {
  id: string;
  org_id: string;
  name: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  status: 'active' | 'inactive' | 'maintenance';
  location?: string;
  install_date?: string;
  warranty_expiration?: string;
  notes?: string;
  team_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  attributes?: EquipmentAttribute[];
  
  // Adding cross-organization properties
  team_name?: string;
  org_name?: string;
  is_external_org?: boolean;
  can_edit?: boolean;
}

export interface EquipmentAttribute {
  id?: string;
  equipment_id: string;
  key: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkNote {
  id: string;
  equipment_id?: string;
  work_order_id?: string;
  created_by: string;
  note: string;
  created_at: string;
  author?: string;
  content?: string;
  hours_worked?: number;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
}

// Add a type mapping for the response from the API
export interface ApiTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

// Add a type mapping function to convert API response to our TeamMember type
export function mapApiTeamMemberToTeamMember(apiMember: ApiTeamMember): TeamMember {
  return {
    id: apiMember.id,
    user_id: apiMember.user_id,
    team_id: apiMember.team_id,
    display_name: apiMember.name,
    name: apiMember.name,
    email: apiMember.email,
    role: apiMember.role,
    status: apiMember.status,
    joined_at: apiMember.joined_at
  };
}
