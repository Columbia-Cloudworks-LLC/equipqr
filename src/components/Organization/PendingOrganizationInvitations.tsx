
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  getPendingOrganizationInvitations, 
  resendOrganizationInvite, 
  cancelOrganizationInvite
} from '@/services/organization/invitationService';
import { OrganizationInvitation } from '@/services/organization/invitation/types';
import { toast } from '@/hooks/use-toast';

interface PendingOrganizationInvitationsProps {
  organizationId: string;
  refreshTrigger?: number;
}

const PendingOrganizationInvitations: React.FC<PendingOrganizationInvitationsProps> = ({ 
  organizationId,
  refreshTrigger = 0
}) => {
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});

  // Load pending invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      try {
        const invitations = await getPendingOrganizationInvitations(organizationId);
        setPendingInvitations(invitations);
      } catch (error) {
        console.error('Error fetching pending invitations:', error);
        toast.error("Error", {
          description: "Failed to fetch pending invitations"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [organizationId, refreshTrigger]);

  const handleResendInvite = async (invitationId: string) => {
    setProcessingIds(prev => ({ ...prev, [invitationId]: true }));
    try {
      const result = await resendOrganizationInvite(invitationId);
      if (!result.success) {
        toast.error("Error", {
          description: result.error || "Failed to resend invitation"
        });
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setProcessingIds(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setProcessingIds(prev => ({ ...prev, [invitationId]: true }));
    try {
      const result = await cancelOrganizationInvite(invitationId);
      if (result.success) {
        // Remove from local state for immediate UI update
        setPendingInvitations(prev => prev.filter(invitation => invitation.id !== invitationId));
      } else {
        toast.error("Error", {
          description: result.error || "Failed to cancel invitation"
        });
      }
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setProcessingIds(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Loading pending invitations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>No pending invitations</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>Manage pending organization invitations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Date Sent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell className="capitalize">{invitation.role}</TableCell>
                <TableCell>
                  {new Date(invitation.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvite(invitation.id)}
                      disabled={Boolean(processingIds[invitation.id])}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelInvite(invitation.id)}
                      disabled={Boolean(processingIds[invitation.id])}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PendingOrganizationInvitations;
