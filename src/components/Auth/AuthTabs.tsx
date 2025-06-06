
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { Link } from 'react-router-dom';

interface AuthTabsProps {
  activeTab: 'login' | 'signup';
  onTabChange: (value: string) => void;
  email: string;
  setEmail: (email: string) => void;
  handleGoogleSignIn: () => Promise<void>;
  handleMicrosoftSignIn: () => Promise<void>;
  isLoading: boolean;
  handleTroubleshooting: () => void;
  onBackToLogin: () => void;
}

export function AuthTabs({
  activeTab,
  onTabChange,
  email,
  setEmail,
  handleGoogleSignIn,
  handleMicrosoftSignIn,
  isLoading,
  handleTroubleshooting,
  onBackToLogin
}: AuthTabsProps) {
  return (
    <div className="mt-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
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
            handleMicrosoftSignIn={handleMicrosoftSignIn}
            isLoading={isLoading}
            onBackToLogin={onBackToLogin}
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
    </div>
  );
}
