
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface InvitationContentProps {
  invitationType: 'team' | 'organization';
  invitationDetails: any;
  onAccept: (token: string, invitationType?: string) => Promise<void>;
  token: string;
}

export function InvitationContent({ 
  invitationType, 
  invitationDetails,
  onAccept,
  token
}: InvitationContentProps) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  
  const handleAccept = async () => {
    setProcessing(true);
    await onAccept(token, invitationType);
    setProcessing(false);
  };
  
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
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium">Invited by:</div>
              <div>{invitationDetails.invited_by_email || 'A member'}</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Role:</div>
              <div className="capitalize">{invitationDetails.role}</div>
            </div>
            {invitationType === 'organization' && (
              <div className="text-sm">
                <div className="font-medium">Organization:</div>
                <div>{invitationDetails.organization?.name || invitationDetails.org_name || 'Unknown'}</div>
              </div>
            )}
            {invitationType === 'team' && (
              <div className="text-sm">
                <div className="font-medium">Team:</div>
                <div>{invitationDetails.team?.name || invitationDetails.team_name || 'Unknown'}</div>
              </div>
            )}
            {invitationType === 'team' && invitationDetails.org_name && (
              <div className="text-sm">
                <div className="font-medium">Organization:</div>
                <div>{invitationDetails.org_name}</div>
              </div>
            )}
          </div>
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
            onClick={() => navigate('/')} 
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
