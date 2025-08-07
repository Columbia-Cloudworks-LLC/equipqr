export interface WorkOrderFilters {
  searchQuery: string;
  statusFilter: string;
  assigneeFilter: string;
  teamFilter: string;
  priorityFilter: string;
  dueDateFilter: string;
}

export interface WorkOrderData {
  id: string;
  title: string;
  description: string;
  equipmentId: string;
  organizationId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assigneeId?: string;
  assigneeName?: string;
  teamId?: string;
  teamName?: string;
  createdDate: string;
  created_date: string;
  dueDate?: string;
  estimatedHours?: number;
  completedDate?: string;
  equipmentName?: string;
  createdByName?: string;
}

export interface WorkOrderAcceptanceModalState {
  open: boolean;
  workOrder: WorkOrderData | null;
}

// Enhanced work order interface for creation - more flexible to match existing types
export interface WorkOrder {
  id: string;
  title?: string;
  description?: string;
  equipment_id?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  assignee_id?: string;
  team_id?: string;
  created_by?: string;
  created_date?: string;
  due_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  acceptance_date?: string;
  assignee_name?: string;
  created_by_name?: string;
  is_historical?: boolean;
  historical_start_date?: string;
  historical_notes?: string;
  created_by_admin?: string;
  has_pm?: boolean;
  pm_required?: boolean;
  organization_id?: string;
}

export interface EntityContext {
  teamId?: string;
  assigneeId?: string;
  status?: string;
  createdBy?: string;
}

export interface AssignmentOption {
  id: string;
  name: string;
  email: string;
  role: string;
}