export interface CacheStats {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  fetchingQueries: number;
  errorQueries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  activeSubscriptions: number;
  queuedItems: number;
  reconnectAttempts: number;
}

export interface WorkOrderImage {
  id: string;
  work_order_id: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  is_private_note?: boolean;
  note?: string;
}

export interface WorkOrderAcceptanceData {
  acceptedAt: Date;
  acceptedBy: string;
  estimatedHours?: number;
  notes?: string;
}