export interface WorkOrderCostItem {
  id: string;
  work_order_id: string;
  type: 'labor' | 'parts' | 'other';
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderCostUpdateData {
  description?: string;
  quantity?: number;
  unit_cost?: number;
  type?: 'labor' | 'parts' | 'other';
}