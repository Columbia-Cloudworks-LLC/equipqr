
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resetAuthState } from '@/utils/authInterceptors';

/**
 * Hook to check authentication status and handle unauthenticated users
 */
export function useAuthenticationCheck() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthStatus('loading');
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session) {
          console.log('Valid session found, user is authenticated');
          setAuthStatus('authenticated');
        } else {
          console.log('No valid session found, user is unauthenticated');
          setAuthStatus('unauthenticated');
          
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
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthStatus('unauthenticated');
        setAuthError('There was a problem verifying your authentication status.');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const redirectToLogin = (message: string) => {
    // Save return path and redirect to auth
    const currentPath = window.location.pathname;
    localStorage.setItem('authReturnTo', currentPath);
    
    resetAuthState(); // Clear tokens to ensure clean login
    
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
