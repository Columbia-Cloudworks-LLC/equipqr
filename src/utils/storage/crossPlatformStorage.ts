
import { IndexedDBStorage } from './indexedDBStorage';
import { StorageAdapter, StorageValue } from './types';

/**
 * Adapter that wraps IndexedDB with localStorage fallback
 * and provides a compatible interface for Supabase
 */
export class CrossPlatformStorage implements StorageAdapter {
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
