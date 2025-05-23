
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { InvitationDetails } from './InvitationDetails';
import { useInvitationAcceptance } from './hooks';

interface InvitationContentProps {
  invitationType: 'team' | 'organization';
  invitationDetails: any;
  onAccept: (token: string, type?: string) => Promise<any>;
  token: string;
}

export function InvitationContent({ 
  invitationType, 
  invitationDetails,
  onAccept,
  token
}: InvitationContentProps) {
  const { processing, handleAccept, handleDecline } = useInvitationAcceptance({
    onAccept,
    token,
    invitationType
  });
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>
            {invitationType === 'organization' ? 'Organization Invitation' : 'Team Invitation'}
          </CardTitle>
          <CardDescription>
            {invitationType === 'organization' 
              ? `You've been invited to join ${invitationDetails.organization?.name || invitationDetails.org_name || 'an organization'} as a ${invitationDetails.role}.`
              : `You've been invited to join ${invitationDetails.team?.name || invitationDetails.team_name || 'a team'} as a ${invitationDetails.role}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationDetails 
            invitationType={invitationType} 
            invitationDetails={invitationDetails} 
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            onClick={handleAccept} 
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : "Accept Invitation"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDecline} 
            disabled={processing}
            className="w-full"
          >
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
