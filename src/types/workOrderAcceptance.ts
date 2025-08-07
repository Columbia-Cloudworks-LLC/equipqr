export interface WorkOrderAcceptanceData {
  assignmentType?: 'user' | 'team';
  assignmentId?: string;
  notes?: string;
  estimatedHours?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface WorkOrderAcceptanceModalProps {
  open: boolean;
  onClose: () => void;
  workOrder: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    equipment_id: string;
    assignee_id?: string;
    team_id?: string;
  };
  organizationId: string;
  onAccept: (data: WorkOrderAcceptanceData) => Promise<void>;
}