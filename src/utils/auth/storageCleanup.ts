
import { getSupabaseProjectRef } from './authUtils';

/**
 * Clear all Supabase-related storage data in browser
 */
export function clearAllAuthStorageData(): void {
  // Get Supabase project ref
  const projectRef = getSupabaseProjectRef();
  
  if (!projectRef) {
    console.warn('Could not determine Supabase project ref');
    return;
  }
  
  // Clear all known Supabase auth storage keys
  const keysToRemove = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
    `supabase.auth.token`,
    `supabase.auth.refreshToken`,
    `sb-${projectRef}-provider-token`,
    `sb-${projectRef}-session`
  ];
  
  console.log(`Clearing ${keysToRemove.length} auth storage keys`);
  
  // Try to clear from both localStorage and sessionStorage
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      
      // Also try to clear from IndexedDB
      try {
        const dbName = 'supabase-auth';
        const storeName = 'auth-store';
        const request = indexedDB.open(dbName);
        
        request.onsuccess = function(event) {
          const db = request.result;
          try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            store.delete(key);
          } catch (e) {
            console.error(`Failed to remove key from IndexedDB: ${key}`, e);
          } finally {
            db.close();
          }
        };
      } catch (idbError) {
        console.error(`Failed to access IndexedDB`, idbError);
      }
      
      console.log(`Removed ${key} from storage`);
    } catch (e) {
      console.error(`Failed to remove storage key: ${key}`, e);
    }
  });
}

/**
 * Clear any auth-related cookies
 */
export function clearAuthCookies(): void {
  try {
    const projectRef = getSupabaseProjectRef();
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name && (name.includes('supabase') || (projectRef && name.includes(projectRef)))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        console.log(`Cleared cookie: ${name}`);
      }
    }
  } catch (e) {
    console.error('Failed to clear cookies:', e);
  }
}
