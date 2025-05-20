
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const InvalidInvitation = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Invalid Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-4 space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">This invitation link is invalid or has expired</h3>
            <p className="text-muted-foreground text-sm">
              The invitation may have been canceled, already accepted, or has expired.
              Please contact the person who invited you to request a new invitation.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => navigate('/my-invitations')}
              className="w-full"
            >
              View My Invitations
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
