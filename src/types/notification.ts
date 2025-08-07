export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'work_order_request' | 'work_order_accepted' | 'work_order_assigned' | 'work_order_completed' | 'team_assignment';
  read: boolean;
  created_at: string;
  data?: {
    work_order_id?: string;
    created_by?: string;
    [key: string]: any;
  };
}

export interface NotificationData {
  work_order_id?: string;
  created_by?: string;
  equipment_id?: string;
  team_id?: string;
  priority?: string;
  status?: string;
}