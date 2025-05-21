
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { inviteToOrganization } from '@/services/organization/invitationService';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationInvitationProps {
  organizationId: string;
  onInviteSent?: () => void;
}

const OrganizationInvitation: React.FC<OrganizationInvitationProps> = ({ organizationId, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valid organization roles (excluding technician which is team-specific)
  const validOrgRoles: UserRole[] = ['viewer', 'manager', 'owner'];

  const handleInvite = async () => {
    if (!email) {
      toast.error("Error", {
        description: "Please enter an email address"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await inviteToOrganization(email, role, organizationId);

      if (!result.success) {
        toast.error("Invitation Failed", {
          description: result.error || "Failed to send invitation"
        });
        return;
      }

      if (result.error) {
        // Warning (e.g. email failed but invitation created)
        toast.default("Invitation Created", {
          description: result.error
        });
      } else {
        toast.success("Invitation Sent", {
          description: `An invitation has been sent to ${email}`
        });
      }

      // Reset form
      setEmail('');

      // Call the callback if provided
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error: any) {
      console.error('Error in handleInvite:', error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
        <CardDescription>
          Invite a new member to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {role === 'viewer' && "Viewers can view equipment and public notes, but cannot make changes."}
              {role === 'manager' && "Managers can edit equipment records and manage team assignments."}
              {role === 'owner' && "Owners have full access to the organization, including member management."}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInvite} 
          disabled={isSubmitting || !email}
          className="w-full"
        >
          {isSubmitting ? "Sending..." : "Send Invitation"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrganizationInvitation;
