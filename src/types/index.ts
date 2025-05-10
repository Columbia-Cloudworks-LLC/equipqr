
export interface Equipment {
  id: string;
  org_id: string;
  team_id?: string;
  name: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  status: 'active' | 'inactive' | 'maintenance';
  location?: string;
  install_date?: string;
  warranty_expiration?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WorkNote {
  id: string;
  work_order_id: string;
  equipment_id?: string;
  created_by: string;
  note: string;
  hours_worked?: number;
  created_at: string;
  deleted_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  created_by: string;
  created_at: string;
  deleted_at?: string;
  members?: TeamMember[];
}

export interface AppUser {
  id: string;
  auth_uid: string;
  email: string;
  display_name?: string;
  created_at: string;
  last_login_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  contact_info?: any;
  created_at: string;
  deleted_at?: string;
}

export interface WorkOrder {
  id: string;
  org_id: string;
  equipment_id: string;
  customer_id?: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'closed' | 'on_hold' | 'cancelled';
  created_by: string;
  opened_at: string;
  closed_at?: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ScanHistory {
  id: string;
  equipment_id: string;
  scanned_by_user_id?: string;
  scanned_from_ip?: string;
  ts: string;
}

export interface ImageUpload {
  id: string;
  equipment_id?: string;
  work_note_id?: string;
  uploaded_by: string;
  object_key: string;
  bucket: string;
  mime_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  checksum_sha256?: string;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  deleted_at?: string;
}

export interface DashboardStat {
  label: string;
  value: number;
  change?: number;
  icon: React.ElementType;
}
