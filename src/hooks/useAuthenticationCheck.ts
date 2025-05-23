
import { useState, useEffect } from 'react';
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
        
        // Then validate the session
        const isValid = await checkSession();
        
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
        setAuthStatus('unauthenticated');
        setAuthError('There was a problem verifying your authentication status.');
        handleUnauthenticated();
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
