
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InvitationProps {
  invitation: any;
  error: string | null;
  isAccepting: boolean;
  user: any;
  onAccept: () => void;
  onNavigateHome: () => void;
}

export function InvitationDetails({ 
  invitation, 
  error, 
  isAccepting, 
  user, 
  onAccept, 
  onNavigateHome 
}: InvitationProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);
  
  const teamName = invitation?.team?.name || 'Unknown Team';
  const orgName = invitation?.org_name;
  const roleName = invitation?.role || 'member';
  const inviterEmail = invitation?.invited_by_email || 'A team member';
  
  const handleAcceptClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      onAccept();
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Team Invitation</CardTitle>
          {orgName && (
            <Badge variant="outline" className="ml-2">
              {orgName}
            </Badge>
          )}
        </div>
        <CardDescription>
          You've been invited to join a team in {orgName ? `the ${orgName} organization` : 'an organization'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showLoginPrompt && !user ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription>
              You need to log in to accept this invitation.
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={onAccept}
              >
                Continue to login
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Team Details</h3>
              <p>Team: <span className="font-medium">{teamName}</span></p>
              {orgName && <p>Organization: <span className="font-medium">{orgName}</span></p>}
              <p>Role: <span className="font-medium capitalize">{roleName}</span></p>
              <p>Invited by: {inviterEmail}</p>
              
              {user && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  <p className="text-sm flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Logged in as {user.email}
                  </p>
                </div>
              )}
            </div>
            
            <div className="prose prose-sm">
              <h4>Role permissions:</h4>
              {roleName === 'manager' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Manage team members</li>
                  <li>Create and manage equipment</li>
                  <li>View and edit all team data</li>
                </ul>
              )}
              {roleName === 'technician' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>View equipment details</li>
                  <li>Create work notes</li>
                  <li>Update equipment status</li>
                </ul>
              )}
              {roleName === 'viewer' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>View equipment details</li>
                  <li>View work notes</li>
                  <li>Read-only access</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onNavigateHome}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 
          Back
        </Button>
        <Button 
          onClick={handleAcceptClick}
          disabled={isAccepting}
        >
          {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? 'Accept Invitation' : 'Login to Accept'}
        </Button>
      </CardFooter>
    </Card>
  );
}
