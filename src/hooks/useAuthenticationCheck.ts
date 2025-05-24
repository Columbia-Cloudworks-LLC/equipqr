
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check authentication status and handle unauthenticated users
 */
export function useAuthenticationCheck() {
  const navigate = useNavigate();
  const { user, isLoading, checkSession } = useAuth();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const lastCheckTime = useRef<number>(0);
  const checkCooldown = 30000; // 30 seconds cooldown between checks

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthStatus('loading');
        
        if (isLoading) {
          return; // Wait for auth to finish loading
        }

        // First check if we have a user
        if (!user) {
          console.log('No user found, user is unauthenticated');
          setAuthStatus('unauthenticated');
          handleUnauthenticated();
          return;
        }
        
        // Implement cooldown for session validation to prevent aggressive checking
        const now = Date.now();
        if (now - lastCheckTime.current < checkCooldown) {
          console.log('Session check on cooldown, assuming valid session');
          setAuthStatus('authenticated');
          return;
        }
        
        // Then validate the session
        const isValid = await checkSession();
        lastCheckTime.current = now;
        
        if (isValid) {
          console.log('Valid session found, user is authenticated');
          setAuthStatus('authenticated');
        } else {
          console.log('No valid session found, user is unauthenticated');
          setAuthStatus('unauthenticated');
          handleUnauthenticated();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Don't immediately redirect on errors - could be temporary network issues
        setAuthError('There was a problem verifying your authentication status.');
        
        // Only redirect if we definitely have no user
        if (!user) {
          setAuthStatus('unauthenticated');
          handleUnauthenticated();
        } else {
          // Give benefit of doubt if we have a user object
          setAuthStatus('authenticated');
        }
      }
    };
    
    const handleUnauthenticated = () => {
      // Save current path to return after login
      const currentPath = window.location.pathname;
      localStorage.setItem('authReturnTo', currentPath);
      
      toast.error('Authentication Required', {
        description: 'You must be logged in to manage equipment',
      });
      
      navigate('/auth', { 
        state: { 
          returnTo: currentPath,
          message: 'You need to sign in to manage equipment'
        } 
      });
    };
    
    checkAuth();
  }, [navigate, user, isLoading, checkSession]);

  const redirectToLogin = (message: string) => {
    // Save return path and redirect to auth
    const currentPath = window.location.pathname;
    localStorage.setItem('authReturnTo', currentPath);
    
    navigate('/auth', { 
      state: { 
        returnTo: currentPath,
        message
      } 
    });
  };

  return {
    authStatus,
    authError,
    redirectToLogin
  };
}
