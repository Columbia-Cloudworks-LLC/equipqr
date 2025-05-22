
/**
 * Interface for equipment work notes
 */
export interface WorkNote {
  id: string;
  equipment_id: string;
  work_order_id?: string;
  created_by: string;
  note: string;
  created_at: string;
  is_public: boolean;
  hours_worked?: number;
  author?: string;
  content?: string;
}
