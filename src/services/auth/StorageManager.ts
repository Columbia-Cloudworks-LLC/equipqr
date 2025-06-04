
import { STORAGE_KEYS } from '@/config/environment';

/**
 * Manages authentication-related storage operations
 */
export class StorageManager {
  
  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn(`StorageManager: Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`StorageManager: Error setting item ${key}:`, error);
      // Fallback to session storage
      try {
        sessionStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error(`StorageManager: Failed to set item ${key} in both storages:`, fallbackError);
      }
    }
  }

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`StorageManager: Error removing item ${key}:`, error);
    }
  }

  /**
   * Get the session storage key for the current Supabase project
   */
  getSessionKey(): string {
    return STORAGE_KEYS.authToken;
  }

  /**
   * Get the legacy session storage key
   */
  getLegacySessionKey(): string {
    return STORAGE_KEYS.supabaseAuthToken;
  }

  /**
   * Clear all authentication-related data
   */
  async clearAuthData(): Promise<void> {
    console.log('StorageManager: Clearing all auth data');
    
    const keysToRemove = [
      STORAGE_KEYS.authToken,
      STORAGE_KEYS.authTokenCodeVerifier,
      STORAGE_KEYS.supabaseAuthToken,
      STORAGE_KEYS.authReturnTo,
      STORAGE_KEYS.authRedirectCount,
      STORAGE_KEYS.invitationPath
    ];

    for (const key of keysToRemove) {
      await this.removeItem(key);
    }
  }

  /**
   * Repair storage by removing corrupted entries
   */
  async repairStorage(): Promise<boolean> {
    try {
      console.log('StorageManager: Attempting storage repair');
      
      // Check for corrupted auth tokens and remove them
      const authToken = await this.getItem(STORAGE_KEYS.authToken);
      if (authToken && this.isCorruptedToken(authToken)) {
        await this.removeItem(STORAGE_KEYS.authToken);
        console.log('StorageManager: Removed corrupted auth token');
      }

      return true;
    } catch (error) {
      console.error('StorageManager: Storage repair failed:', error);
      return false;
    }
  }

  /**
   * Check if a token appears to be corrupted
   */
  private isCorruptedToken(token: string): boolean {
    try {
      // Basic validation - JWT tokens should have 3 parts separated by dots
      const parts = token.split('.');
      return parts.length !== 3;
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
