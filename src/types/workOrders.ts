
import { WorkOrderStatus } from './supabase-enums';

export interface WorkOrder {
  id: string;
  equipment_id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  estimated_hours?: number;
  submitted_by: string;
  submitted_at: string;
  accepted_at?: string;
  assigned_at?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  equipment_name?: string;
  submitted_by_name?: string;
  assigned_to_name?: string;
}

export interface WorkOrderAuditLog {
  id: string;
  work_order_id: string;
  changed_by: string;
  change_type: 'status_change' | 'assignee_change' | 'field_update';
  old_value: any;
  new_value: any;
  created_at: string;
  
  // Joined fields
  changed_by_name?: string;
}

export interface CreateWorkOrderParams {
  equipment_id: string;
  title: string;
  description: string;
}

export interface UpdateWorkOrderParams {
  title?: string;
  description?: string;
  status?: WorkOrderStatus;
  estimated_hours?: number;
  assigned_to?: string;
}
