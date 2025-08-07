export interface WorkOrderData {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_date: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  assignee_id?: string;
  assigneeName?: string;
  teamName?: string;
  team_id?: string;
  equipment_id: string;
  organization_id: string;
  has_pm?: boolean;
  assignee?: {
    id: string;
    name: string;
  };
}

export interface EquipmentData {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: 'active' | 'maintenance' | 'inactive';
  location?: string;
}

export interface PMData {
  id: string;
  status: string;
  completed_at?: string;
  checklist_data?: unknown;
  notes?: string;
  created_at: string;
}

export interface PreventativeMaintenance {
  id: string;
  status: string;
  completed_at?: string;
  notes?: string;
  is_historical: boolean;
  historical_completion_date?: string;
}

export interface HistoricalWorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  historical_start_date?: string;
  historical_notes?: string;
  completed_date?: string;
  assignee_name?: string;
  created_by_name?: string;
  equipment_id: string;
  organization_id: string;
  is_historical: boolean;
  preventative_maintenance?: PreventativeMaintenance[];
}

export interface ExtendedWorkOrder {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  created_date: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  assignee_name?: string;
  team_name?: string;
  has_pm?: boolean;
  equipment_name?: string;
  equipment_id: string;
  organization_id: string;
}

export interface PermissionLevels {
  isManager: boolean;
  isRequestor: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canAddNotes: boolean;
  canAddImages: boolean;
  canEditPriority?: boolean;
  canEditAssignment?: boolean;
  canEditDueDate?: boolean;
  canEditDescription?: boolean;
  canAddCosts?: boolean;
  canEditCosts?: boolean;
  canViewPM?: boolean;
  canEditPM?: boolean;
}

export interface TeamMemberData {
  id?: string;
  name: string;
  email?: string;
  role?: 'manager' | 'technician' | 'requestor' | 'viewer';
  status?: 'active' | 'pending' | 'inactive';
}

export interface OrganizationData {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
}