// Unified WorkOrder interface that encompasses all work order variations
export interface UnifiedWorkOrder {
  id: string;
  title: string;
  description: string;
  equipment_id: string;
  organization_id: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignee_id?: string | null;
  assigneeName?: string;
  team_id?: string | null;
  teamName?: string;
  created_date: string;
  created_by?: string;
  due_date?: string | null;
  estimated_hours?: number | null;
  completed_date?: string | null;
  equipmentName?: string;
  createdByName?: string;
  has_pm?: boolean;
  acceptance_date?: string;
  assignee_name?: string;
  created_by_admin?: string;
  created_by_name?: string;
  equipment_name?: string;
  notes?: string;
  preventative_maintenance?: any[];
  updated_at?: string;
}

// Type guards to safely convert between types
export const isUnifiedWorkOrder = (obj: any): obj is UnifiedWorkOrder => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
};

export const toUnifiedWorkOrder = (workOrder: any): UnifiedWorkOrder => {
  return {
    id: workOrder.id,
    title: workOrder.title,
    description: workOrder.description,
    equipment_id: workOrder.equipment_id || workOrder.equipmentId,
    organization_id: workOrder.organization_id || workOrder.organizationId,
    priority: workOrder.priority,
    status: workOrder.status,
    assignee_id: workOrder.assignee_id || workOrder.assigneeId,
    assigneeName: workOrder.assigneeName || workOrder.assignee_name,
    team_id: workOrder.team_id || workOrder.teamId,
    teamName: workOrder.teamName || workOrder.team_name,
    created_date: workOrder.created_date || workOrder.createdDate,
    created_by: workOrder.created_by,
    due_date: workOrder.due_date || workOrder.dueDate,
    estimated_hours: workOrder.estimated_hours || workOrder.estimatedHours,
    completed_date: workOrder.completed_date || workOrder.completedDate,
    equipmentName: workOrder.equipmentName || workOrder.equipment_name,
    createdByName: workOrder.createdByName || workOrder.created_by_name,
    has_pm: workOrder.has_pm,
    acceptance_date: workOrder.acceptance_date,
    assignee_name: workOrder.assignee_name,
    created_by_admin: workOrder.created_by_admin,
    created_by_name: workOrder.created_by_name,
    equipment_name: workOrder.equipment_name,
    notes: workOrder.notes,
    preventative_maintenance: workOrder.preventative_maintenance,
    updated_at: workOrder.updated_at
  };
};