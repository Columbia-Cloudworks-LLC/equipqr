
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { validateOrganizationInvitation, acceptOrganizationInvitation } from '@/services/organization/invitationService';
import { validateInvitationToken, acceptInvitation } from '@/services/team/invitation';
import { Loader2 } from 'lucide-react';

function InvitationPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const invitationType = searchParams.get('type') || 'team';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          setError('No invitation token provided');
          setLoading(false);
          return;
        }
        
        if (invitationType === 'organization') {
          // Handle organization invitation
          const { valid, invitation, error } = await validateOrganizationInvitation(token);
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        } else {
          // Handle team invitation
          const { valid, invitation, error } = await validateInvitationToken(token);
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        }
      } catch (error: any) {
        console.error('Error validating invitation:', error);
        setError(error.message || 'An error occurred validating the invitation');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, invitationType]);

  const handleAcceptInvitation = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      if (invitationType === 'organization') {
        // Handle organization invitation
        const response = await acceptOrganizationInvitation(token!);
        
        if (response.success) {
          // Update to use correct route path
          navigate('/settings/organization');
        } else {
          setError(response.error || 'Failed to accept invitation');
        }
      } else {
        // Handle team invitation
        const result = await acceptInvitation(token!);
        
        if (result.success) {
          navigate('/team');
        } else {
          setError('Failed to accept invitation');
        }
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-md my-12">
        <Card>
          <CardHeader>
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>Please wait while we validate your invitation...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md my-12">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invitationDetails) {
    return (
      <div className="container mx-auto max-w-md my-12">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>The invitation could not be found or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            onClick={handleAcceptInvitation} 
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

export default InvitationPage;
