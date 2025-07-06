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
import { UserPlus, Mail, Info, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCreateInvitation, CreateInvitationData } from '@/hooks/useOrganizationInvitations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { calculateSimplifiedBilling } from '@/utils/simplifiedBillingUtils';
import { useInvitationPerformance } from '@/hooks/useInvitationPerformance';
import { toast } from 'sonner';

interface SimplifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SimplifiedInvitationDialog: React.FC<SimplifiedInvitationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');

  const { data: members = [] } = useOrganizationMembers(currentOrg?.id || '');
  const createInvitation = useCreateInvitation(currentOrg?.id || '');
  const billing = calculateSimplifiedBilling(members);
  const { startTimer, endTimer, getAverageTime } = useInvitationPerformance();

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

    const startTime = startTimer();
    const invitationData: CreateInvitationData = {
      email: email.trim(),
      role,
      message: message.trim() || undefined,
      reserveSlot: false // No slot reservation in simplified model
    };

    try {
      await createInvitation.mutateAsync(invitationData);
      
      // Track successful invitation
      endTimer(startTime, 'invitation_creation', true);
      
      // Reset form
      setEmail('');
      setRole('member');
      setMessage('');
      onOpenChange(false);
      
      // Call success callback to switch to invitations tab
      if (onSuccess) {
        onSuccess();
      }

      // Show success with performance info
      const avgTime = getAverageTime('invitation_creation');
      if (avgTime > 0) {
        toast.success(`Invitation sent successfully (${Math.round(avgTime)}ms avg)`, {
          description: `${email} will receive an invitation to join ${currentOrg?.name}`
        });
      }
    } catch (error: any) {
      // Track failed invitation
      endTimer(startTime, 'invitation_creation', false, error.message);
      
      console.error('Failed to create invitation:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to send invitation';
      let errorDescription = 'Please try again or contact support if the issue persists';
      
      if (error.code === '23505') {
        errorMessage = 'An invitation to this email already exists';
        errorDescription = 'Check your pending invitations or try a different email address';
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = 'Please sign in to send invitations';
        errorDescription = 'Your session may have expired';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to invite members';
        errorDescription = 'Contact your organization administrator for access';
      } else if (error.message?.includes('stack depth') || error.message?.includes('overloaded')) {
        errorMessage = 'System is temporarily busy';
        errorDescription = 'Please wait a moment and try again';
      } else if (error.message?.includes('database')) {
        errorMessage = 'Database connection issue';
        errorDescription = 'Please check your internet connection and try again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
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