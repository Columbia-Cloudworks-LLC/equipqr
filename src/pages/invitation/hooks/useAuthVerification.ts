
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuthVerification() {
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionCheckAttempt, setSessionCheckAttempt] = useState(0);

  // Refreshes the auth session to ensure valid tokens for API calls
  const refreshAuthSession = useCallback(async () => {
    try {
      if (isRefreshing) {
        console.log("Auth session refresh already in progress");
        return false;
      }
      
      setIsRefreshing(true);
      console.log("Forcing auth session refresh");
      
      // Check if we have a valid session
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error("No valid session found", error);
        setIsRefreshing(false);
        return false;
      }
      
      // Then refresh to get a new token
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          if (refreshError?.message?.includes('429') || refreshError?.status === 429) {
            console.warn('Rate limit detected during session refresh');
            toast.warning("Rate limit detected", {
              description: "Please wait a moment before trying again"
            });
          } else {
            console.error("Error refreshing session:", refreshError);
            toast.error("Authentication error", {
              description: "Could not refresh your session. Please try logging out and in again."
            });
          }
          setIsRefreshing(false);
          return false;
        }
        
        console.log("Session refreshed successfully, token:", refreshData.session.access_token.substring(0, 10) + '...');
        setAuthVerified(true);
        setIsRefreshing(false);
        return true;
      } catch (refreshError: any) {
        console.error("Error refreshing session:", refreshError);
        setIsRefreshing(false);
        return false;
      }
    } catch (err) {
      console.error("Error in refreshAuthSession:", err);
      setIsRefreshing(false);
      return false;
    }
  }, [isRefreshing]);

  // Force refresh auth session on mount
  useEffect(() => {
    const forceSessionRefresh = async () => {
      try {
        console.log('Forcing auth session refresh on mount');
        // Get the current session first
        const { data: currentSession } = await supabase.auth.getSession();
        
        if (currentSession?.session) {
          console.log('Active session found, refreshing tokens');
          await supabase.auth.refreshSession();
          setAuthVerified(true);
        } else {
          console.log('No active session found');
          setWaitingForAuth(true);
        }
      } catch (err) {
        console.error('Error refreshing session:', err);
      }
    };
    
    forceSessionRefresh();
  }, []);

  return {
    waitingForAuth,
    setWaitingForAuth,
    authVerified,
    setAuthVerified,
    refreshAuthSession,
    sessionCheckAttempt,
    setSessionCheckAttempt,
    isRefreshing
  };
}
