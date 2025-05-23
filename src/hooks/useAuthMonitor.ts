
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { completeAuthVerification, repairBrokenSession } from '@/utils/auth/sessionVerification';

export interface AuthMonitorState {
  isVerifying: boolean;
  lastVerified: number | null;
  isHealthy: boolean;
  lastError: string | null;
  isRepairing: boolean;
}

/**
 * Hook that provides global auth state monitoring and repair capabilities
 */
export function useAuthMonitor() {
  const { user, session, checkSession } = useAuth();
  const [monitorState, setMonitorState] = useState<AuthMonitorState>({
    isVerifying: false,
    lastVerified: null,
    isHealthy: !!session,
    lastError: null,
    isRepairing: false
  });
  
  // Function to verify the current authentication state
  const verifyAuthState = useCallback(async (force = false) => {
    // Skip verification if no session exists or we're already verifying
    if ((!user && !session) || monitorState.isVerifying) {
      return false;
    }
    
    // Skip if verified recently (within last 30 seconds) unless forced
    const now = Date.now();
    if (!force && monitorState.lastVerified && now - monitorState.lastVerified < 30000) {
      return monitorState.isHealthy;
    }
    
    try {
      setMonitorState(prev => ({ ...prev, isVerifying: true }));
      
      // Perform complete verification including API call test
      const isValid = await completeAuthVerification(false, false);
      
      setMonitorState(prev => ({
        ...prev,
        isVerifying: false,
        lastVerified: now,
        isHealthy: isValid,
        lastError: isValid ? null : 'Session verification failed'
      }));
      
      return isValid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown verification error';
      
      setMonitorState(prev => ({
        ...prev,
        isVerifying: false,
        lastVerified: now,
        isHealthy: false,
        lastError: errorMsg
      }));
      
      return false;
    }
  }, [user, session, monitorState.isVerifying, monitorState.lastVerified]);
  
  // Function to repair the auth state when issues are detected
  const repairAuthState = useCallback(async () => {
    if (monitorState.isRepairing) return false;
    
    try {
      setMonitorState(prev => ({ ...prev, isRepairing: true }));
      
      const repaired = await repairBrokenSession();
      if (repaired) {
        // If repaired, re-verify to confirm
        await verifyAuthState(true);
      }
      
      setMonitorState(prev => ({
        ...prev, 
        isRepairing: false,
        isHealthy: repaired,
        lastVerified: repaired ? Date.now() : prev.lastVerified
      }));
      
      return repaired;
    } catch (error) {
      setMonitorState(prev => ({ 
        ...prev, 
        isRepairing: false,
        lastError: error instanceof Error ? error.message : 'Unknown repair error'
      }));
      
      return false;
    }
  }, [monitorState.isRepairing, verifyAuthState]);

  // Set up initial verification when component mounts
  useEffect(() => {
    if (user && session) {
      // Wait a short delay for auth state to stabilize
      const timer = setTimeout(() => {
        verifyAuthState();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, session, verifyAuthState]);

  // Monitor auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Auth monitor detected auth state change:', event);
        
        // Clear verification state on signout
        if (event === 'SIGNED_OUT') {
          setMonitorState({
            isVerifying: false,
            lastVerified: null,
            isHealthy: false,
            lastError: null,
            isRepairing: false
          });
          return;
        }
        
        // Verify on sign in or token refresh events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Small delay to allow auth state to propagate
          setTimeout(() => {
            verifyAuthState(true);
          }, 1000);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [verifyAuthState]);

  return {
    ...monitorState,
    verifyAuthState,
    repairAuthState
  };
}
