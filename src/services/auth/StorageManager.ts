
import { Session } from '@supabase/supabase-js';
import { environmentAwareStorageManager } from './EnvironmentAwareStorageManager';

/**
 * Storage manager for authentication-related storage operations
 * Now uses environment-aware storage to prevent session mixing
 */
export class StorageManager {
  /**
   * Get the current session key (environment-aware)
   */
  public getSessionKey(): string {
    return environmentAwareStorageManager.getSessionKey();
  }
  
  /**
   * Get the legacy session key (environment-aware)
   */
  public getLegacySessionKey(): string {
    return environmentAwareStorageManager.getLegacySessionKey();
  }

  /**
   * Get an item from localStorage with error handling (environment-aware)
   */
  public async getItem(key: string): Promise<string | null> {
    return environmentAwareStorageManager.getItem(key);
  }

  /**
   * Set an item in localStorage with error handling (environment-aware)
   */
  public async setItem(key: string, value: string): Promise<void> {
    return environmentAwareStorageManager.setItem(key, value);
  }

  /**
   * Remove an item from localStorage with error handling (environment-aware)
   */
  public async removeItem(key: string): Promise<void> {
    return environmentAwareStorageManager.removeItem(key);
  }

  /**
   * Clear all auth-related data from storage (environment-aware)
   */
  public async clearAuthData(): Promise<void> {
    return environmentAwareStorageManager.clearAuthData();
  }

  /**
   * Repair storage inconsistencies (environment-aware)
   */
  public async repairStorage(): Promise<boolean> {
    return environmentAwareStorageManager.repairStorage();
  }
  
  /**
   * Get environment information for debugging
   */
  public getEnvironmentInfo(): Record<string, any> {
    return environmentAwareStorageManager.getEnvironmentInfo();
  }
}

// Create singleton instance
export const storageManager = new StorageManager();
