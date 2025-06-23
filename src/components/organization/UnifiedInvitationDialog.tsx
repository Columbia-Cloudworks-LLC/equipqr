
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Mail, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCreateInvitation, CreateInvitationData } from '@/hooks/useOrganizationInvitations';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';

interface UnifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseSlots: (quantity: number) => void;
}

type DialogStep = 'check-slots' | 'purchase-slots' | 'send-invitation';

const UnifiedInvitationDialog: React.FC<UnifiedInvitationDialogProps> = ({
  open,
  onOpenChange,
  onPurchaseSlots
}) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();
  const [step, setStep] = useState<DialogStep>('check-slots');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');
  const [slotsToPurchase, setSlotsToPurchase] = useState(5);

  const { data: slotAvailability } = useSlotAvailability(currentOrg?.id || '');
  const createInvitation = useCreateInvitation(currentOrg?.id || '');

  const hasAvailableSlots = (slotAvailability?.available_slots || 0) > 0;

  // Reset dialog state when opened
  React.useEffect(() => {
    if (open) {
      if (hasAvailableSlots) {
        setStep('send-invitation');
      } else {
        setStep('check-slots');
      }
      setEmail('');
      setRole('member');
      setMessage('');
    }
  }, [open, hasAvailableSlots]);

  const handlePurchaseSlots = () => {
    onPurchaseSlots(slotsToPurchase);
    onOpenChange(false);
  };

  const handleSubmitInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    const invitationData: CreateInvitationData = {
      email: email.trim(),
      role,
      message: message.trim() || undefined,
      reserveSlot: true
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

  const renderStepContent = () => {
    switch (step) {
      case 'check-slots':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No available user license slots. You need to purchase slots before inviting team members.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Slot Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Purchased:</span>
                  <span className="font-medium">{slotAvailability?.total_purchased || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currently Used:</span>
                  <span className="font-medium">{slotAvailability?.used_slots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <Badge variant={hasAvailableSlots ? 'default' : 'destructive'}>
                    {slotAvailability?.available_slots || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setStep('purchase-slots')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase Slots
              </Button>
            </div>
          </div>
        );

      case 'purchase-slots':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slots-quantity">Number of User License Slots</Label>
              <Select 
                value={slotsToPurchase.toString()} 
                onValueChange={(value) => setSlotsToPurchase(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 slots ($50)</SelectItem>
                  <SelectItem value="10">10 slots ($100)</SelectItem>
                  <SelectItem value="20">20 slots ($200)</SelectItem>
                  <SelectItem value="50">50 slots ($500)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Each slot costs $10 and allows you to invite one team member
              </p>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                After purchasing slots, you'll be able to send invitations immediately. 
                Billing only occurs when invitations are accepted.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setStep('check-slots')}
              >
                Back
              </Button>
              <Button onClick={handlePurchaseSlots}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase {slotsToPurchase} Slots
              </Button>
            </div>
          </div>
        );

      case 'send-invitation':
        return (
          <form onSubmit={handleSubmitInvitation} className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {slotAvailability?.available_slots} slots available. A slot will be reserved for this invitation.
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
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case 'check-slots':
        return 'Check Slot Availability';
      case 'purchase-slots':
        return 'Purchase User License Slots';
      case 'send-invitation':
        return 'Invite New Member';
      default:
        return 'Invite Member';
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case 'check-slots':
        return 'You need available user license slots to send invitations';
      case 'purchase-slots':
        return 'Purchase slots to enable team member invitations';
      case 'send-invitation':
        return `Send an invitation to join ${currentOrg?.name}`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedInvitationDialog;
