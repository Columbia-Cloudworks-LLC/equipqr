
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Mail, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Invitation } from '@/types';

interface PendingInvitationsListProps {
  invitations: Invitation[];
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvite: (id: string) => Promise<void>;
  resendingInvite: string | null;
  cancelingInvite: string | null;
}

export function PendingInvitationsList({
  invitations,
  onResendInvite,
  onCancelInvite,
  resendingInvite,
  cancelingInvite
}: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pending invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{invitation.email}</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Role:</strong> {invitation.role}</p>
                <p><strong>Invited:</strong> {format(new Date(invitation.created_at), 'MMM d, yyyy \'at\' h:mm a')}</p>
                <p><strong>Expires:</strong> {format(new Date(invitation.expires_at), 'MMM d, yyyy \'at\' h:mm a')}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResendInvite(invitation.id)}
                  disabled={resendingInvite === invitation.id}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {resendingInvite === invitation.id ? 'Resending...' : 'Resend'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelInvite(invitation.id)}
                  disabled={cancelingInvite === invitation.id}
                  className="text-destructive hover:text-destructive"
                >
                  {cancelingInvite === invitation.id ? 'Canceling...' : 'Cancel'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
