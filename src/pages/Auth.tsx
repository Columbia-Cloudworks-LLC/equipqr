
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthPage } from '@/hooks/useAuthPage';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { AuthMessageAlert } from '@/components/Auth/AuthMessageAlert';
import { AuthTabs } from '@/components/Auth/AuthTabs';
import { AuthCardFooter } from '@/components/Auth/AuthCardFooter';
import { AuthLogo } from '@/components/Auth/AuthLogo';

export default function Auth() {
  const {
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
  } = useAuthPage();

  // Don't render anything if redirecting
  if (user && session && isInitialized) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <AuthHeader />

      <div className="w-full py-8 px-4">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-4 text-center">
                <AuthLogo className="mb-2" />
                <div className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl">
                    {pageTitle}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {pageDescription}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AuthMessageAlert message={message} isInvitation={isInvitation} />
                
                <AuthTabs 
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  email={email}
                  setEmail={setEmail}
                  handleGoogleSignIn={handleGoogleSignIn}
                  handleMicrosoftSignIn={handleMicrosoftSignIn}
                  isLoading={isLoading}
                  handleTroubleshooting={handleTroubleshooting}
                  onBackToLogin={() => setActiveTab('login')}
                />
              </CardContent>
              <AuthCardFooter />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
