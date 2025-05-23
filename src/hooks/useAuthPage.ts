
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface AuthPageState {
  returnTo?: string;
  message?: string;
  isInvitation?: boolean;
  invitationType?: 'team' | 'organization';
}

export function useAuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { signInWithGoogle, resetAuthSystem, user, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract state information
  const state = location.state as AuthPageState | undefined;
  
  const message = state?.message;
  const isInvitation = state?.isInvitation;
  const invitationType = state?.invitationType;
  const returnTo = state?.returnTo || localStorage.getItem('authReturnTo') || '/';
  
  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user && session && isInitialized) {
      console.log("Auth page: User already authenticated, redirecting to", returnTo);
      navigate(returnTo, { replace: true });
    } else {
      // Mark as initialized after first check
      setIsInitialized(true);
    }
  }, [user, session, navigate, returnTo, isInitialized]);
  
  // Check for invitation in session storage and set the tab appropriately
  useEffect(() => {
    // Try to get invitation details from session storage
    const invitationPath = sessionStorage.getItem('invitationPath');
    const invitationType = sessionStorage.getItem('invitationType');

    // If there's an invitation pending (either from state or session storage), default to signup tab for new users
    if ((invitationPath || isInvitation) && !document.cookie.includes('sb-')) {
      // Only switch to signup if there's no auth cookie, suggesting this is a new user
      setActiveTab('signup');
    }
  }, [isInvitation]);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // AuthRedirect will handle navigation once authenticated
    } catch (error) {
      // Error handled in auth context
      console.error("Google sign-in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle troubleshooting button click
  const handleTroubleshooting = () => {
    resetAuthSystem();
    toast.success("Authentication system reset", {
      description: "All authentication data has been cleared. Please try signing in again."
    });
    
    // Reset redirect count to prevent redirect loops
    sessionStorage.removeItem('authRedirectCount');
    setIsInitialized(false);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
  };

  // Get page title and description based on invitation context
  const getPageContent = () => {
    if (isInvitation) {
      const entityType = state?.invitationType || sessionStorage.getItem('invitationType') || 'team';
      
      return {
        title: `Accept ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Invitation`,
        description: `Sign in or create an account to accept your ${entityType} invitation`,
        message: message || `You need to sign in or create an account to accept this ${entityType} invitation`
      };
    }
    
    return {
      title: 'Welcome to EquipQR',
      description: activeTab === 'login' 
        ? 'Sign in to your account to continue' 
        : 'Create an account to get started',
      message
    };
  };

  return {
    activeTab,
    setActiveTab,
    email,
    setEmail,
    isLoading,
    setIsLoading,
    isInitialized,
    user,
    session,
    message: getPageContent().message,
    pageTitle: getPageContent().title,
    pageDescription: getPageContent().description,
    isInvitation,
    handleGoogleSignIn,
    handleTroubleshooting,
    handleTabChange
  };
}
