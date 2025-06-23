
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Mail, Info } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCreateInvitation, CreateInvitationData } from '@/hooks/useOrganizationInvitations';

interface EnhancedInviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSlots: number;
}

const EnhancedInviteMemberDialog: React.FC<EnhancedInviteMemberDialogProps> = ({
  open,
  onOpenChange,
  availableSlots
}) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');

  const createInvitation = useCreateInvitation(currentOrg?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    const invitationData: CreateInvitationData = {
      email: email.trim(),
      role,
      message: message.trim() || undefined,
      reserveSlot: availableSlots > 0
    };

    try {
      await createInvitation.mutateAsync(invitationData);
      
      // Reset form
      setEmail('');
      setRole('member');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create invitation:', error);
    }
  };

  const roleDescriptions = {
    admin: 'Can manage members, teams, and organization settings',
    member: 'Can access and manage assigned equipment and work orders'
  };

  const noSlotsAvailable = availableSlots <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentOrg?.name}
          </DialogDescription>
        </DialogHeader>

        {noSlotsAvailable && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No available slots. Purchase more slots to invite additional team members.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <span>Member</span>
                        <Badge variant="outline" className="text-xs">Standard</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <span>Admin</span>
                        <Badge variant="secondary" className="text-xs">Management</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              The invitation will expire in 7 days
            </div>
            
            {availableSlots > 0 && (
              <div className="text-sm text-muted-foreground">
                A slot will be reserved for this invitation ({availableSlots} slots available)
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createInvitation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!email.trim() || createInvitation.isPending || noSlotsAvailable}
              >
                {createInvitation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedInviteMemberDialog;
