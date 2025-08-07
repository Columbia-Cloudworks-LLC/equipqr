export interface CacheStats {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  fetchingQueries: number;
  errorQueries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync?: string;
  syncErrors: number;
  queuedItems: number;
  reconnectAttempts: number;
  activeSubscriptions: number;
}