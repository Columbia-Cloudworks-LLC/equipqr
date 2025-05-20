
import { createSupabaseStorage } from './createSupabaseStorage';

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
