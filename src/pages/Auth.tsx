
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Info } from 'lucide-react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { signInWithGoogle, resetAuthSystem, user, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract state information
  const state = location.state as { 
    returnTo?: string; 
    message?: string;
    isInvitation?: boolean;
    invitationType?: 'team' | 'organization';
  } | undefined;
  
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

  const pageContent = getPageContent();

  // Don't render anything if redirecting
  if (user && session && isInitialized) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Simple header with logo */}
      <header className="border-b bg-background/95 backdrop-blur p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">equipqr</h1>
        </div>
        
        <div className="text-sm text-muted-foreground">v1.1</div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">
              {pageContent.title}
            </CardTitle>
            <CardDescription>
              {pageContent.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pageContent.message && (
              <Alert className="mb-4">
                {isInvitation ? (
                  <Info className="h-4 w-4 mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                <AlertDescription>{pageContent.message}</AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm 
                  email={email}
                  setEmail={setEmail}
                  handleGoogleSignIn={handleGoogleSignIn}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
            
            <div className="mt-6">
              <div className="text-center space-y-2">
                <div>
                  <Link 
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/90 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <button
                    onClick={handleTroubleshooting}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Having trouble signing in?
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2">
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
