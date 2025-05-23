
// Re-export storage utilities for backward compatibility
import { storageManager } from '@/services/auth/StorageManager';
import { sessionManager } from '@/services/auth/SessionManager';

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

// Export storage managers under a different name for backward compatibility
export const createSupabaseStorage = () => {
  return {
    getItem: async (key: string) => storageManager.getItem(key),
    setItem: async (key: string, value: string) => storageManager.setItem(key, value),
    removeItem: async (key: string) => storageManager.removeItem(key)
  };
};
