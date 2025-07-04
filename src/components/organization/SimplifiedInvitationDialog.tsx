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
import { UserPlus, Mail, Info, DollarSign } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCreateInvitation, CreateInvitationData } from '@/hooks/useOrganizationInvitations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { calculateSimplifiedBilling } from '@/utils/simplifiedBillingUtils';

interface SimplifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SimplifiedInvitationDialog: React.FC<SimplifiedInvitationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');

  const { data: members = [] } = useOrganizationMembers(currentOrg?.id || '');
  const createInvitation = useCreateInvitation(currentOrg?.id || '');
  const billing = calculateSimplifiedBilling(members);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setEmail('');
      setRole('member');
      setMessage('');
    }
  }, [open]);

  const handleSubmitInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    const invitationData: CreateInvitationData = {
      email: email.trim(),
      role,
      message: message.trim() || undefined,
      reserveSlot: false // No slot reservation in simplified model
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

  const costAfterInvite = calculateSimplifiedBilling([...members, {
    id: 'temp',
    name: 'New Member',
    email,
    role,
    status: 'active' as const,
    joinedDate: new Date().toISOString()
  }]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentOrg?.name}. They'll be automatically billed when they accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitInvitation} className="space-y-6">
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>Current monthly cost: <strong>${billing.userLicenses.totalCost}</strong></div>
                <div>After this invite: <strong>${costAfterInvite.userLicenses.totalCost}</strong></div>
                <div className="text-xs text-muted-foreground">
                  +$10/month when they accept (pay-as-you-go pricing)
                </div>
              </div>
            </AlertDescription>
          </Alert>

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

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Simple Pay-as-you-go Billing:</div>
                <div className="text-sm">
                  • No upfront costs or slot purchases required<br/>
                  • Billing starts automatically when they accept<br/>
                  • Cancel anytime with no penalties
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              The invitation will expire in 7 days
            </div>
            
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
                disabled={!email.trim() || createInvitation.isPending}
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

export default SimplifiedInvitationDialog;