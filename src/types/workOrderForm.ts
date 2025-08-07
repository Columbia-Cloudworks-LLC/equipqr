export interface Equipment {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: 'active' | 'maintenance' | 'inactive';
  location?: string;
}

export interface WorkOrderFormProps {
  values: WorkOrderFormData;
  errors: Record<string, string>;
  setValue: (field: keyof WorkOrderFormData, value: any) => void;
  preSelectedEquipment?: Equipment;
}

// Simplified interface for form components  
export interface WorkOrderFormData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  equipmentId?: string;
  estimated_hours?: number;
  hasPM?: boolean;
  assignmentType?: 'unassigned' | 'user' | 'team';
  assignmentId?: string;
  isHistorical?: boolean;
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  historicalStartDate?: Date;
  historicalNotes?: string;
  completedDate?: Date;
}

export interface WorkOrderFormFieldProps {
  values: WorkOrderFormData;
  errors: Record<string, string>;
  setValue: (field: string, value: any) => void;
  preSelectedEquipment?: Equipment;
}