
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { validateInvitationToken, acceptInvitation } from '@/services/team/invitationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Validate the invitation token on component mount
  useEffect(() => {
    async function checkInvitation() {
      if (!token) {
        setError('No invitation token provided');
        setIsValidating(false);
        return;
      }

      try {
        console.log("Validating invitation token:", token);
        const result = await validateInvitationToken(token);
        console.log("Validation result:", result);
        
        setIsValid(result.valid);
        
        if (!result.valid) {
          setError(result.error || 'Invalid invitation');
        } else if (result.invitation) {
          setInvitation(result.invitation);
          
          // Check if the current user's email matches the invitation email
          if (user?.email && result.invitation.email && 
              user.email.toLowerCase() !== result.invitation.email.toLowerCase()) {
            setError(`This invitation was sent to ${result.invitation.email}. 
                      You are currently logged in as ${user.email}. 
                      Please log out and sign in with the correct account.`);
          }
        }
      } catch (err: any) {
        console.error('Error validating invitation:', err);
        setError(`Error validating invitation: ${err.message}`);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    checkInvitation();
  }, [token, user]);

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Store the invitation route to redirect back after login
      sessionStorage.setItem('invitationPath', window.location.pathname);
      
      toast.info("Please sign in to accept the invitation", {
        description: "You'll be redirected back after signing in"
      });
      
      // Redirect to auth page
      navigate('/auth');
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);
      
      console.log("Accepting invitation with token:", token);
      const result = await acceptInvitation(token!);
      console.log("Acceptance result:", result);
      
      toast.success(`Welcome to ${result.teamName || "the team"}!`, {
        description: `You have successfully joined as a ${result.role || "member"}`
      });
      
      // Redirect to team management page
      navigate('/team');
      
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(`Error accepting invitation: ${err.message}`);
      toast.error("Error accepting invitation", {
        description: err.message
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isValidating || isAuthLoading) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>Checking Invitation</CardTitle>
              <CardDescription>Validating your invitation...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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

  if (!isValid) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <Card className="w-full border-destructive">
            <CardHeader className="text-center">
              <CardTitle className="flex justify-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                <span>Invalid Invitation</span>
              </CardTitle>
              <CardDescription>
                This invitation link is not valid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || 'This invitation link is invalid or has expired.'}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  // Safely get team name with fallback
  const teamName = invitation?.team?.name || "Team";

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              {invitation ? (
                <>
                  You've been invited to join <strong>{teamName}</strong> as a <strong>{invitation.role || "member"}</strong>
                </>
              ) : 'You have been invited to join a team'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-muted p-4 text-sm space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team:</span>
                <span className="font-medium">{teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{invitation?.role || "member"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invited by:</span>
                <span className="font-medium">{invitation?.invited_by_email || "Unknown"}</span>
              </div>
              {invitation?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invitation sent to:</span>
                  <span className="font-medium">{invitation?.email}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              onClick={handleAcceptInvitation} 
              className="w-full" 
              disabled={isAccepting || (user && invitation?.email && user.email.toLowerCase() !== invitation.email.toLowerCase())}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
            
            {!user && (
              <div className="text-sm text-center text-muted-foreground">
                You'll need to sign in or create an account to join this team
              </div>
            )}
            
            {user && invitation?.email && user.email.toLowerCase() !== invitation.email.toLowerCase() && (
              <div className="text-sm text-center text-destructive">
                This invitation was sent to {invitation.email}. You are currently logged in as {user.email}.
                Please log out and sign in with the correct account.
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
