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