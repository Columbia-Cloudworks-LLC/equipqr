
import { Session } from '@supabase/supabase-js';

/**
 * Storage manager for authentication-related storage operations
 * Handles cross-browser compatibility issues and provides utilities
 * for managing auth tokens and session data
 */
export class StorageManager {
  private projectRef: string = "oxeheowbfsshpyldlskb"; // Your Supabase project reference
  
  /**
   * Get the current session key
   */
  public getSessionKey(): string {
    return `sb-${this.projectRef}-auth-token`;
  }
  
  /**
   * Get the legacy session key
   */
  public getLegacySessionKey(): string {
    return 'supabase.auth.token';
  }

  /**
   * Get an item from localStorage with error handling
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage with error handling
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  /**
   * Remove an item from localStorage with error handling
   */
  public async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  }

  /**
   * Clear all auth-related data from storage
   */
  public async clearAuthData(): Promise<void> {
    try {
      // Remove session tokens
      await this.removeItem(this.getSessionKey());
      await this.removeItem(this.getLegacySessionKey());
      
      // Clear any invitation data
      sessionStorage.removeItem('invitationPath');
      sessionStorage.removeItem('invitationType');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Repair storage inconsistencies between localStorage and sessionStorage
   */
  public async repairStorage(): Promise<boolean> {
    try {
      console.log('StorageManager: Attempting to repair session storage');
      let repaired = false;
      
      // Check for session in localStorage
      const sessionKey = this.getSessionKey();
      const sessionData = localStorage.getItem(sessionKey);
      
      if (sessionData) {
        try {
          // Validate JSON and session structure
          const session = JSON.parse(sessionData);
          if (session?.access_token && session?.refresh_token) {
            console.log('StorageManager: Found valid session in localStorage');
            repaired = true;
          }
        } catch (e) {
          console.error('StorageManager: Found corrupt session in localStorage:', e);
          
          // Reset corrupted session
          localStorage.removeItem(sessionKey);
          repaired = false;
        }
      } else {
        // Check legacy storage
        const legacyKey = this.getLegacySessionKey();
        const legacyData = localStorage.getItem(legacyKey);
        
        if (legacyData) {
          try {
            // Attempt to migrate legacy session format
            const session = JSON.parse(legacyData);
            if (session?.access_token && session?.refresh_token) {
              console.log('StorageManager: Found legacy session, migrating');
              localStorage.setItem(sessionKey, legacyData);
              repaired = true;
            }
          } catch (e) {
            console.error('StorageManager: Legacy session is corrupt:', e);
          }
        }
      }
      
      return repaired;
    } catch (error) {
      console.error('StorageManager: Error repairing storage:', error);
      return false;
    }
  }
}

// Create singleton instance
export const storageManager = new StorageManager();
