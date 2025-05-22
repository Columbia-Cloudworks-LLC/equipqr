
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { AuthRedirect } from '@/components/Auth/AuthRedirect';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { performFullAuthReset } from '@/utils/authInterceptors';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail } from 'lucide-react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signInWithGoogle } = useAuth();
  const location = useLocation();
  
  // Extract state information
  const state = location.state as { 
    returnTo?: string; 
    message?: string;
    isInvitation?: boolean;
  } | undefined;
  
  const message = state?.message;
  const isInvitation = state?.isInvitation;
  
  // Check for invitation in session storage and set the tab appropriately
  useEffect(() => {
    const invitationPath = sessionStorage.getItem('invitationPath');
    if (invitationPath || isInvitation) {
      // If there's an invitation pending, default to signup tab for new users
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
    } finally {
      setIsLoading(false);
    }
  };

  // Handle troubleshooting button click
  const handleTroubleshooting = () => {
    performFullAuthReset();
    toast.success("Authentication system reset", {
      description: "All authentication data has been cleared. Please try signing in again."
    });
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Add the AuthRedirect component to handle redirects */}
      <AuthRedirect />
      
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
              {isInvitation ? 'Accept Invitation' : 'Welcome to EquipQR'}
            </CardTitle>
            <CardDescription>
              {isInvitation 
                ? 'Sign in or create an account to accept your invitation' 
                : activeTab === 'login' 
                  ? 'Sign in to your account to continue' 
                  : 'Create an account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className="mb-4">
                <Mail className="h-4 w-4 mr-2" />
                <AlertDescription>{message}</AlertDescription>
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
          <CardFooter className="flex justify-center">
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
