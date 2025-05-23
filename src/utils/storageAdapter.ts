
// Re-export storage utilities for backward compatibility
export { storageManager as createSupabaseStorage } from '@/services/auth/StorageManager';
export { sessionManager } from '@/services/auth/SessionManager';

// Re-export types and validation functions
export { validateSession, getSessionInfo } from './authInterceptors';
export { repairSessionStorage } from './authInterceptors';

// Define type for backward compatibility
export type StorageValue = string | null;

// Storage adapter interface for backward compatibility
export interface StorageAdapter {
  getItem(key: string): Promise<StorageValue>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
