import type { LucideIcon } from 'lucide-react';

export interface WorkOrderAction {
  label: string;
  action: () => void;
  icon: LucideIcon;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  description: string;
  disabled?: boolean;
}

export interface WorkOrderStatusAction {
  status: string;
  label: string;
  color: string;
  requiresConfirmation?: boolean;
  permissionRequired?: 'manager' | 'technician' | 'assignee' | 'creator';
}

export interface PMChecklistData {
  items: PMChecklistItem[];
  completedItems: number;
  totalItems: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface PMChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'note' | 'pm_update';
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  icon: LucideIcon;
  color: string;
}