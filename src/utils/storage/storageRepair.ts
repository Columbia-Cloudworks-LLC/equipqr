
import { createSupabaseStorage } from './createSupabaseStorage';

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
