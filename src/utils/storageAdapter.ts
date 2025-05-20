
/**
 * Cross-platform storage adapter that works reliably across web and mobile
 * Uses IndexedDB with localStorage fallback
 */

type StorageValue = string | null;

interface StorageAdapter {
  getItem(key: string): Promise<StorageValue>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * IndexedDB implementation for more reliable storage
 */
class IndexedDBStorage implements StorageAdapter {
  private readonly DB_NAME = 'supabase-auth';
  private readonly STORE_NAME = 'auth-store';
  private readonly DB_VERSION = 1;

  private async getConnection(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = (event) => {
        console.error('IndexedDB connection error:', event);
        reject(new Error('Failed to connect to IndexedDB'));
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async getItem(key: string): Promise<StorageValue> {
    try {
      const db = await this.getConnection();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to get item: ${key}`));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getConnection();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(value, key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to set item: ${key}`));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getConnection();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to remove item: ${key}`));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
      localStorage.removeItem(key);
    }
  }
}

/**
 * Adapter that wraps IndexedDB with localStorage fallback
 * and provides a compatible interface for Supabase
 */
class CrossPlatformStorage implements StorageAdapter {
  private indexedDB = new IndexedDBStorage();
  
  async getItem(key: string): Promise<StorageValue> {
    try {
      // Try IndexedDB first
      const indexedDBValue = await this.indexedDB.getItem(key);
      const localStorageValue = localStorage.getItem(key);
      
      // If values differ between storage mechanisms, log the discrepancy
      if (indexedDBValue !== localStorageValue) {
        console.warn(`Storage inconsistency for ${key}:`, {
          indexedDB: indexedDBValue ? '[exists]' : null,
          localStorage: localStorageValue ? '[exists]' : null
        });
        
        // FIX: If IndexedDB has a value but localStorage doesn't, synchronize localStorage
        if (indexedDBValue && !localStorageValue) {
          console.log(`Repairing storage inconsistency for ${key} - syncing localStorage`);
          localStorage.setItem(key, indexedDBValue);
        }
        
        // FIX: If localStorage has a value but IndexedDB doesn't, synchronize IndexedDB
        if (!indexedDBValue && localStorageValue) {
          console.log(`Repairing storage inconsistency for ${key} - syncing IndexedDB`);
          this.indexedDB.setItem(key, localStorageValue);
        }
      }
      
      // Return IndexedDB value if available, otherwise localStorage
      if (indexedDBValue !== null) {
        return indexedDBValue;
      }
      
      return localStorageValue;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Store in both IndexedDB and localStorage for redundancy
      const promises = [
        this.indexedDB.setItem(key, value),
        Promise.resolve(localStorage.setItem(key, value))
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Storage setItem error:', error);
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Remove from both IndexedDB and localStorage
      const promises = [
        this.indexedDB.removeItem(key),
        Promise.resolve(localStorage.removeItem(key))
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      localStorage.removeItem(key);
    }
  }
}

/**
 * Creates a storage object compatible with Supabase Auth
 * that provides better reliability on mobile devices
 */
export const createSupabaseStorage = () => {
  const crossPlatformStorage = new CrossPlatformStorage();
  
  return {
    getItem: async (key: string) => {
      console.log('Storage: Getting item', key);
      const value = await crossPlatformStorage.getItem(key);
      console.log('Storage: Got item', key, value ? '[value exists]' : 'null');
      return value;
    },
    setItem: async (key: string, value: string) => {
      console.log('Storage: Setting item', key);
      await crossPlatformStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      console.log('Storage: Removing item', key);
      await crossPlatformStorage.removeItem(key);
    }
  };
};

/**
 * Utility function to check if a session is valid
 */
export const validateSession = async (session: any): Promise<boolean> => {
  if (!session) return false;
  if (!session.access_token) return false;
  if (!session.refresh_token) return false;
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeRemaining = expiry - now;
    
    if (now >= expiry) {
      console.warn(`Session token expired ${Math.abs(timeRemaining) / 1000} seconds ago`);
      return false;
    }
    
    console.log(`Session valid. Expires in ${timeRemaining / 1000} seconds`);
    return true;
  } catch (error) {
    console.error('Error validating session token:', error);
    return false;
  }
};

/**
 * Debug utility to get current session info
 */
export const getSessionInfo = async (): Promise<Record<string, any>> => {
  const storage = createSupabaseStorage();
  const projectRef = "oxeheowbfsshpyldlskb";
  
  try {
    // Check both possible session keys
    const sessionKey = `sb-${projectRef}-auth-token`;
    const legacySessionKey = 'supabase.auth.token';
    
    let sessionData = await storage.getItem(sessionKey);
    let storageKey = sessionKey;
    
    if (!sessionData) {
      sessionData = await storage.getItem(legacySessionKey);
      if (sessionData) {
        storageKey = legacySessionKey;
      }
    }
    
    if (!sessionData) {
      return { 
        status: 'missing', 
        checkedKeys: [sessionKey, legacySessionKey]
      };
    }
    
    try {
      const session = JSON.parse(sessionData);
      const isValid = await validateSession(session);
      
      // Check for token in localStorage as well
      const localStorageToken = localStorage.getItem(storageKey);
      const tokensMatch = localStorageToken === sessionData;
      
      return {
        status: isValid ? 'valid' : 'invalid',
        storageKey: storageKey,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: session.expires_at,
        storageConsistent: tokensMatch,
        accessTokenStart: session.access_token ? `${session.access_token.substring(0, 12)}...` : null
      };
    } catch (error) {
      return { 
        status: 'corrupted',
        error: error instanceof Error ? error.message : String(error),
        rawDataLength: sessionData ? sessionData.length : 0
      };
    }
  } catch (error) {
    return { 
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Repair inconsistent session state
 * @returns true if repairs were made, false if no repairs needed
 */
export const repairSessionStorage = async (): Promise<boolean> => {
  const projectRef = "oxeheowbfsshpyldlskb";
  const sessionKey = `sb-${projectRef}-auth-token`;
  const legacyKey = 'supabase.auth.token';
  let repairsMade = false;
  
  try {
    // Create storage adapter
    const storage = createSupabaseStorage();
    
    // Get session from IndexedDB via our storage adapter
    const idbSession = await storage.getItem(sessionKey) || await storage.getItem(legacyKey);
    
    // Get session directly from localStorage
    const localSession = localStorage.getItem(sessionKey) || localStorage.getItem(legacyKey);
    
    // Check if we need to repair
    if (idbSession && !localSession) {
      console.log('Repairing: Found session in IndexedDB but not in localStorage');
      localStorage.setItem(idbSession === await storage.getItem(sessionKey) ? sessionKey : legacyKey, idbSession);
      repairsMade = true;
    } 
    else if (!idbSession && localSession) {
      console.log('Repairing: Found session in localStorage but not in IndexedDB');
      await storage.setItem(localStorage.getItem(sessionKey) ? sessionKey : legacyKey, localSession);
      repairsMade = true;
    }
    else if (idbSession && localSession && idbSession !== localSession) {
      console.log('Repairing: Session inconsistency between IndexedDB and localStorage');
      
      // Try parsing both to see if either is invalid
      let validIdb = false;
      let validLocal = false;
      
      try {
        const idbObj = JSON.parse(idbSession);
        validIdb = !!idbObj && !!idbObj.access_token;
      } catch (e) {
        console.warn('Invalid IndexedDB session format:', e);
      }
      
      try {
        const localObj = JSON.parse(localSession);
        validLocal = !!localObj && !!localObj.access_token;
      } catch (e) {
        console.warn('Invalid localStorage session format:', e);
      }
      
      if (validIdb && !validLocal) {
        localStorage.setItem(sessionKey, idbSession);
        repairsMade = true;
      } else if (!validIdb && validLocal) {
        await storage.setItem(sessionKey, localSession);
        repairsMade = true;
      } else if (validIdb && validLocal) {
        // Both valid but different - use the one with the later expiry
        try {
          const idbObj = JSON.parse(idbSession);
          const localObj = JSON.parse(localSession);
          
          if (idbObj.expires_at > localObj.expires_at) {
            localStorage.setItem(sessionKey, idbSession);
          } else {
            await storage.setItem(sessionKey, localSession);
          }
          repairsMade = true;
        } catch (e) {
          console.error('Error comparing sessions:', e);
        }
      }
    }
    
    return repairsMade;
  } catch (error) {
    console.error('Error in repairSessionStorage:', error);
    return false;
  }
};

