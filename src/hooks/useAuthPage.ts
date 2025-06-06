
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sessionRecovery } from '@/services/auth/SessionRecovery';

export function useAuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { user, session, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check URL parameters for messages and invitation state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorMessage = urlParams.get('error_description') || urlParams.get('error');
    const invitationPath = sessionStorage.getItem('invitationPath');
    
    if (errorMessage) {
      setMessage(errorMessage);
    }
    
    // Set initial tab based on URL or presence of invitation
    const tab = urlParams.get('tab');
    if (tab === 'signup' || invitationPath) {
      setActiveTab('signup');
    }
    
    setIsInitialized(true);
  }, [location]);

  // Redirect authenticated users
  useEffect(() => {
    if (user && session && isInitialized) {
      const returnTo = localStorage.getItem('authReturnTo') || '/';
      localStorage.removeItem('authReturnTo');
      navigate(returnTo, { replace: true });
    }
  }, [user, session, isInitialized, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithMicrosoft();
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleTroubleshooting = async () => {
    try {
      setIsLoading(true);
      const recovered = await sessionRecovery.attemptSessionRecovery();
      if (recovered) {
        setMessage('Session recovered successfully! Please try again.');
      } else {
        setMessage('Unable to recover session. Please try signing in again.');
      }
    } catch (error) {
      setMessage('Recovery attempt failed. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    setMessage(null); // Clear any existing messages when switching tabs
  };

  // Determine page title and description
  const isInvitation = !!sessionStorage.getItem('invitationPath');
  const pageTitle = isInvitation
    ? (activeTab === 'signup' ? 'Accept Invitation' : 'Sign In to Continue')
    : (activeTab === 'signup' ? 'Create Account' : 'Welcome Back');
  
  const pageDescription = isInvitation
    ? 'Complete your account setup to join the team'
    : (activeTab === 'signup' 
        ? 'Create your equipqr account to get started' 
        : 'Sign in to your equipqr account');

  return {
    activeTab,
    setActiveTab,
    email,
    setEmail,
    isLoading,
    isInitialized,
    user,
    session,
    message,
    pageTitle,
    pageDescription,
    isInvitation,
    handleGoogleSignIn,
    handleMicrosoftSignIn,
    handleTroubleshooting,
    handleTabChange
  };
}
