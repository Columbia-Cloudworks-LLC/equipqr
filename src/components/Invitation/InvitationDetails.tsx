
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { InvitationError } from './InvitationStatus';

interface InvitationDetailsProps {
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
}: InvitationDetailsProps) {
  // Safely get team name with fallback
  const teamName = invitation?.team?.name || "Team";
  const emailMismatch = user && invitation?.email && 
                         user.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
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
        {error && <InvitationError error={error} />}

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
          onClick={onAccept} 
          className="w-full" 
          disabled={isAccepting || emailMismatch}
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
        
        {emailMismatch && (
          <div className="text-sm text-center text-destructive">
            This invitation was sent to {invitation.email}. You are currently logged in as {user.email}.
            Please log out and sign in with the correct account.
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onNavigateHome}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
