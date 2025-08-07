export type WorkOrderStatus = 'submitted' | 'assigned' | 'accepted' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface WorkOrderUpdateData {
  status?: WorkOrderStatus;
  assignee_id?: string | null;
  team_id?: string | null;
  updated_at?: string;
  acceptance_date?: string | null;
  completed_date?: string | null;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  estimated_hours?: number | null;
  has_pm?: boolean;
}

export interface PMUpdateData {
  checklist_data: any;
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: string;
  completed_by?: string;
}

export interface AssignmentUpdateData {
  assigneeId: string | null;
}

export interface StatusUpdateData {
  workOrderId: string;
  newStatus: WorkOrderStatus;
}

export interface UpdateWorkOrderData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  estimatedHours?: number | null;
  hasPM?: boolean;
}