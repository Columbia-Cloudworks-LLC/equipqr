
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionHandlerProps {
  token: string | undefined;
  searchParams: URLSearchParams;
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  setAuthVerified: (verified: boolean) => void;
  invitationType?: string;
}

export function SessionHandler({
  token,
  searchParams,
  waitingForAuth,
  setWaitingForAuth,
  sessionCheckAttempt,
  setSessionCheckAttempt,
  setAuthVerified,
  invitationType = 'team'
}: SessionHandlerProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [checkingSession, setCheckingSession] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Save invitation details to session storage when not authenticated
  useEffect(() => {
    if (!user && !authLoading && token) {
      // Save the invitation path for redirection after login
      const typeParam = invitationType === 'organization' ? '?type=organization' : '';
      const invitationPath = `/invitation/${token}${typeParam}${typeParam ? '&' : '?'}${searchParams.toString()}`;
      sessionStorage.setItem('invitationPath', invitationPath);
      sessionStorage.setItem('invitationType', invitationType);
      console.log('Saved invitation path for after login:', invitationPath);
    }
  }, [user, authLoading, token, searchParams, invitationType]);

  // Initial session check when component mounts
  useEffect(() => {
    const performInitialCheck = async () => {
      if (!initialCheckDone && !authLoading) {
        console.log('Performing initial session check');
        try {
          setCheckingSession(true);
          
          // Check if we need to throttle based on recent refreshes
          const now = Date.now();
          if (now - lastRefreshTime < 2000) {
            console.log('Session check throttled - too soon since last check');
            setCheckingSession(false);
            return;
          }
          
          setLastRefreshTime(now);
          
          // First check if we have a valid session from Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            // Notify user of the session error if it's not just a missing session
            if (error.message !== 'Not authenticated' && error.message !== 'JWT expired') {
              toast.error('Session error', { 
                description: 'Please try signing out and in again'
              });
            }
            setWaitingForAuth(true);
            setCheckingSession(false);
            setInitialCheckDone(true);
            return;
          }
          
          const isValid = !!data?.session;
          
          console.log('Initial session check result:', { isValid, user: !!user });
          
          // If we have both a valid session and user, authentication is verified
          if (isValid && user) {
            console.log('Initial check: User authenticated and session valid');
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          } else if (!user) {
            // No user but session might be valid - we're waiting for auth
            console.log('Initial check: No user, waiting for authentication');
            setWaitingForAuth(true);
          } else {
            console.log('Initial check: User exists but session verification failed');
            setWaitingForAuth(true);
          }
        } catch (error) {
          console.error('Error during initial session check:', error);
        } finally {
          setInitialCheckDone(true);
          setCheckingSession(false);
        }
      }
    };
    
    performInitialCheck();
  }, [user, authLoading, initialCheckDone, setWaitingForAuth, setAuthVerified, lastRefreshTime]);

  // Check session validity periodically with exponential backoff when waiting for auth
  useEffect(() => {
    if (waitingForAuth && sessionCheckAttempt < 5 && !checkingSession && initialCheckDone && !sessionVerified) {
      const delay = Math.min(1000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        try {
          const now = Date.now();
          // Prevent rapid-fire calls with a minimum time between refreshes
          if (now - lastRefreshTime < 2000) {
            console.log('Session check throttled - too soon since last check');
            return;
          }
          
          setCheckingSession(true);
          setLastRefreshTime(now);
          
          // Use direct Supabase session check
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error refreshing session:', error);
            setCheckingSession(false);
            return;
          }
          
          setSessionCheckAttempt(prev => prev + 1);
          
          if (data?.session) {
            console.log('Session verification successful - can proceed with invitation');
            
            // Try to trigger a token refresh if close to expiring
            try {
              const payload = JSON.parse(atob(data.session.access_token.split('.')[1]));
              const expiry = payload.exp * 1000; // Convert to milliseconds
              const now = Date.now();
              const timeRemaining = expiry - now;
              
              // If token expires in less than 5 minutes, refresh it
              if (timeRemaining < 300000) {
                console.log('Token expires soon, refreshing...');
                await supabase.auth.refreshSession();
              }
            } catch (tokenError) {
              console.error('Error checking token expiry:', tokenError);
            }
            
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          }
        } catch (error) {
          console.error('Error checking session:', error);
        } finally {
          setCheckingSession(false);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, checkingSession, initialCheckDone, sessionVerified, lastRefreshTime]);

  return null;
}
