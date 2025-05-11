
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useInvitationValidation } from '@/hooks/useInvitationValidation';
import { useInvitationAcceptance } from '@/hooks/useInvitationAcceptance';
import { InvitationValidating, InvalidInvitationCard } from '@/components/Invitation/InvitationStatus';
import { InvitationDetails } from '@/components/Invitation/InvitationDetails';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  
  // Custom hook to validate the invitation
  const { 
    isValidating, 
    isAuthLoading,
    isValid, 
    error, 
    invitation, 
    user 
  } = useInvitationValidation(token);
  
  // Custom hook to handle invitation acceptance
  const { 
    isAccepting, 
    error: acceptError,
    handleAcceptInvitation, 
    navigateHome 
  } = useInvitationAcceptance(token, user);

  // Combine errors from validation and acceptance
  const combinedError = acceptError || error;
  
  // Show loading state while validating
  if (isValidating || isAuthLoading) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <InvitationValidating />
        </div>
      </Layout>
    );
  }

  // Handle missing token
  if (!token) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Invalid Invitation</AlertTitle>
            <AlertDescription>No invitation token was provided.</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Handle invalid invitation
  if (!isValid) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <InvalidInvitationCard error={combinedError || undefined} />
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={navigateHome}>
              Return to Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show invitation details for valid invitation
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <InvitationDetails
          invitation={invitation}
          error={combinedError}
          isAccepting={isAccepting}
          user={user}
          onAccept={handleAcceptInvitation}
          onNavigateHome={navigateHome}
        />
      </div>
    </Layout>
  );
}
