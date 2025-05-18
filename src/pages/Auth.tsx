
import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { AuthRedirect } from '@/components/Auth/AuthRedirect';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signInWithGoogle } = useAuth();
  
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

  return (
    <Layout>
      {/* Add the AuthRedirect component to handle redirects */}
      <AuthRedirect />

      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome to EquipQR</CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Create an account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
