
import { getSupabaseProjectRef } from '@/utils/auth/authUtils';

/**
 * StorageManager provides unified storage functionality for auth data
 * with cross-platform compatibility and error recovery
 */
export class StorageManager {
  private readonly projectRef: string;
  private readonly indexedDBName = 'supabase-auth';
  private readonly storeName = 'auth-store';
  private readonly dbVersion = 1;
  
  constructor() {
    const ref = getSupabaseProjectRef();
    if (!ref) {
      console.error('StorageManager: Could not determine project ref, using default');
      this.projectRef = 'default';
    } else {
      this.projectRef = ref;
    }
  }

  /**
   * Get all known auth storage keys for the current project
   */
  public getAuthKeys(): string[] {
    return [
      `sb-${this.projectRef}-auth-token`,
      `sb-${this.projectRef}-auth-token-code-verifier`,
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      `sb-${this.projectRef}-provider-token`,
      `sb-${this.projectRef}-session`
    ];
  }

  /**
   * Get the primary session key
   */
  public getSessionKey(): string {
    return `sb-${this.projectRef}-auth-token`;
  }

  /**
   * Get legacy session key
   */
  public getLegacySessionKey(): string {
    return 'supabase.auth.token';
  }

  /**
   * Get a value from storage with fallback mechanisms
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      // Try IndexedDB first
      const indexedDBValue = await this.getFromIndexedDB(key);
      
      // Fallback to localStorage
      const localStorageValue = localStorage.getItem(key);
      
      // Handle inconsistency between storage mechanisms
      if (indexedDBValue !== localStorageValue && (indexedDBValue || localStorageValue)) {
        console.warn(`StorageManager: Inconsistency for ${key}`);
        
        // Auto-repair: if one has value and other doesn't
        if (indexedDBValue && !localStorageValue) {
          localStorage.setItem(key, indexedDBValue);
          console.log(`StorageManager: Repaired localStorage for ${key}`);
          return indexedDBValue;
        }
        
        if (!indexedDBValue && localStorageValue) {
          await this.setInIndexedDB(key, localStorageValue);
          console.log(`StorageManager: Repaired IndexedDB for ${key}`);
          return localStorageValue;
        }
        
        // Both have values but different - prefer indexed DB as it's more reliable
        if (indexedDBValue) {
          localStorage.setItem(key, indexedDBValue);
          console.log(`StorageManager: Resolved conflict in favor of IndexedDB for ${key}`);
          return indexedDBValue;
        }
      }
      
      // Return whichever value we have
      return indexedDBValue || localStorageValue;
    } catch (error) {
      console.error('StorageManager: Error in getItem', error);
      // Final fallback
      return localStorage.getItem(key);
    }
  }

  /**
   * Set a value in all storage mechanisms
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      // Store in both mechanisms for redundancy
      const promises = [
        this.setInIndexedDB(key, value),
        Promise.resolve(localStorage.setItem(key, value))
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('StorageManager: Error in setItem', error);
      // Ensure at least localStorage has the value
      localStorage.setItem(key, value);
    }
  }

  /**
   * Remove a value from all storage mechanisms
   */
  public async removeItem(key: string): Promise<void> {
    try {
      // Remove from both mechanisms
      const promises = [
        this.removeFromIndexedDB(key),
        Promise.resolve(localStorage.removeItem(key))
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('StorageManager: Error in removeItem', error);
      // Ensure at least localStorage removal works
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all auth-related data from storage
   */
  public async clearAuthData(): Promise<void> {
    try {
      const keys = this.getAuthKeys();
      
      // Clear all auth keys from both storage mechanisms
      for (const key of keys) {
        await this.removeItem(key);
      }
      
      // Clear auth-related cookies
      this.clearAuthCookies();
      
      // Find and remove any items with auth-related names
      this.clearAdditionalAuthItems();
      
      console.log('StorageManager: All auth data cleared');
    } catch (error) {
      console.error('StorageManager: Error clearing auth data', error);
    }
  }

  /**
   * Clear any auth-related cookies
   */
  private clearAuthCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      
      for (const cookie of cookies) {
        const [name] = cookie.split('=').map(c => c.trim());
        if (name && (name.includes('supabase') || name.includes(this.projectRef))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      }
    } catch (error) {
      console.error('StorageManager: Error clearing cookies', error);
    }
  }

  /**
   * Clear any additional items with auth-related names
   */
  private clearAdditionalAuthItems(): void {
    try {
      // Scan localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.isAuthRelatedKey(key)) {
          localStorage.removeItem(key);
        }
      }
      
      // Scan sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && this.isAuthRelatedKey(key)) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('StorageManager: Error clearing additional items', error);
    }
  }

  /**
   * Check if a key is auth-related
   */
  private isAuthRelatedKey(key: string): boolean {
    return key.includes('supabase') || 
           key.includes('auth') || 
           key.includes('token') ||
           key.includes(this.projectRef);
  }

  /**
   * Repair any inconsistencies between storage mechanisms
   */
  public async repairStorage(): Promise<boolean> {
    try {
      let repairsMade = false;
      const sessionKey = this.getSessionKey();
      const legacyKey = this.getLegacySessionKey();
      
      // Get session from IndexedDB
      const idbSession = await this.getFromIndexedDB(sessionKey) || 
                          await this.getFromIndexedDB(legacyKey);
      
      // Get session from localStorage
      const localSession = localStorage.getItem(sessionKey) || 
                           localStorage.getItem(legacyKey);
      
      if (idbSession && !localSession) {
        // Found in IndexedDB but not localStorage
        const key = await this.getFromIndexedDB(sessionKey) ? sessionKey : legacyKey;
        localStorage.setItem(key, idbSession);
        repairsMade = true;
        console.log(`StorageManager: Repaired ${key} in localStorage`);
      } 
      else if (!idbSession && localSession) {
        // Found in localStorage but not IndexedDB
        const key = localStorage.getItem(sessionKey) ? sessionKey : legacyKey;
        await this.setInIndexedDB(key, localSession);
        repairsMade = true;
        console.log(`StorageManager: Repaired ${key} in IndexedDB`);
      }
      else if (idbSession && localSession && idbSession !== localSession) {
        // Both exist but are different
        repairsMade = await this.resolveConflict(idbSession, localSession, sessionKey, legacyKey);
      }
      
      return repairsMade;
    } catch (error) {
      console.error('StorageManager: Error in repairStorage', error);
      return false;
    }
  }

  /**
   * Resolve conflicts between storage values
   */
  private async resolveConflict(
    idbValue: string, 
    localValue: string,
    sessionKey: string,
    legacyKey: string
  ): Promise<boolean> {
    try {
      // Try parsing both to check validity
      let validIdb = false;
      let validLocal = false;
      let idbObj: any = null;
      let localObj: any = null;
      
      try {
        idbObj = JSON.parse(idbValue);
        validIdb = !!idbObj && !!idbObj.access_token;
      } catch (e) {
        console.warn('StorageManager: Invalid IndexedDB value');
      }
      
      try {
        localObj = JSON.parse(localValue);
        validLocal = !!localObj && !!localObj.access_token;
      } catch (e) {
        console.warn('StorageManager: Invalid localStorage value');
      }
      
      // Handle different scenarios
      if (validIdb && !validLocal) {
        localStorage.setItem(sessionKey, idbValue);
        return true;
      } 
      
      if (!validIdb && validLocal) {
        await this.setInIndexedDB(sessionKey, localValue);
        return true;
      } 
      
      if (validIdb && validLocal) {
        // Both valid but different - use the one with later expiry
        try {
          if (idbObj.expires_at > localObj.expires_at) {
            localStorage.setItem(sessionKey, idbValue);
          } else {
            await this.setInIndexedDB(sessionKey, localValue);
          }
          return true;
        } catch (e) {
          console.error('StorageManager: Error comparing sessions', e);
        }
      }
      
      return false;
    } catch (error) {
      console.error('StorageManager: Error resolving conflict', error);
      return false;
    }
  }

  /**
   * Get a value from IndexedDB
   */
  private async getFromIndexedDB(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) {
          resolve(null);
          return;
        }

        const request = indexedDB.open(this.indexedDBName, this.dbVersion);
        
        request.onerror = () => {
          console.error('StorageManager: Error opening IndexedDB');
          resolve(null);
        };
        
        request.onsuccess = () => {
          try {
            const db = request.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              resolve(null);
              db.close();
              return;
            }

            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
              resolve(getRequest.result || null);
            };
            
            getRequest.onerror = () => {
              console.error('StorageManager: Error getting from IndexedDB');
              resolve(null);
            };
            
            transaction.oncomplete = () => {
              db.close();
            };
          } catch (error) {
            console.error('StorageManager: Error in IndexedDB transaction', error);
            resolve(null);
          }
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      } catch (error) {
        console.error('StorageManager: Error accessing IndexedDB', error);
        resolve(null);
      }
    });
  }

  /**
   * Set a value in IndexedDB
   */
  private async setInIndexedDB(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          resolve();
          return;
        }

        const request = indexedDB.open(this.indexedDBName, this.dbVersion);
        
        request.onerror = () => {
          console.error('StorageManager: Error opening IndexedDB');
          resolve();
        };
        
        request.onsuccess = () => {
          try {
            const db = request.result;
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.put(value, key);
            
            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
            
            transaction.onerror = () => {
              console.error('StorageManager: Error setting in IndexedDB');
              db.close();
              resolve();
            };
          } catch (error) {
            console.error('StorageManager: Error in IndexedDB transaction', error);
            resolve();
          }
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      } catch (error) {
        console.error('StorageManager: Error accessing IndexedDB', error);
        resolve();
      }
    });
  }

  /**
   * Remove a value from IndexedDB
   */
  private async removeFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) {
          resolve();
          return;
        }

        const request = indexedDB.open(this.indexedDBName, this.dbVersion);
        
        request.onerror = () => {
          console.error('StorageManager: Error opening IndexedDB');
          resolve();
        };
        
        request.onsuccess = () => {
          try {
            const db = request.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              resolve();
              db.close();
              return;
            }

            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.delete(key);
            
            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
            
            transaction.onerror = () => {
              console.error('StorageManager: Error removing from IndexedDB');
              db.close();
              resolve();
            };
          } catch (error) {
            console.error('StorageManager: Error in IndexedDB transaction', error);
            resolve();
          }
        };
      } catch (error) {
        console.error('StorageManager: Error accessing IndexedDB', error);
        resolve();
      }
    });
  }
}

// Create singleton instance
export const storageManager = new StorageManager();
