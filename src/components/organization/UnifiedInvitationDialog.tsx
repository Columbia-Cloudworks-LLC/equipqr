
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
import { UserPlus, Mail, ShoppingCart, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCreateInvitation, CreateInvitationData } from '@/hooks/useOrganizationInvitations';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';

interface UnifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseSlots: (quantity: number) => void;
}

type DialogStep = 'check-slots' | 'purchase-slots' | 'send-invitation';

const SLOT_PACKAGES = [
  { quantity: 5, price: 50, popular: false },
  { quantity: 10, price: 100, popular: true },
  { quantity: 20, price: 200, popular: false },
  { quantity: 50, price: 500, popular: false },
];

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
  const [selectedPackage, setSelectedPackage] = useState(SLOT_PACKAGES[1]); // Default to popular package

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
    onPurchaseSlots(selectedPackage.quantity);
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
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No available user license slots. Purchase slots to invite team members.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  Current Slot Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{slotAvailability?.total_purchased || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Purchased</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{slotAvailability?.used_slots || 0}</div>
                    <div className="text-xs text-muted-foreground">Currently Used</div>
                  </div>
                  <div className="space-y-1">
                    <Badge variant={hasAvailableSlots ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                      {slotAvailability?.available_slots || 0}
                    </Badge>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
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
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Select Slot Package</h3>
                <p className="text-sm text-muted-foreground">
                  Each slot allows you to invite one team member
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SLOT_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.quantity}
                    className={`cursor-pointer transition-all ${
                      selectedPackage.quantity === pkg.quantity 
                        ? 'ring-2 ring-primary shadow-md' 
                        : 'hover:shadow-sm'
                    } ${pkg.popular ? 'border-primary' : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      {pkg.popular && (
                        <Badge className="mb-1">Most Popular</Badge>
                      )}
                      <div className="text-2xl font-bold">{pkg.quantity}</div>
                      <div className="text-xs text-muted-foreground">User Slots</div>
                      <div className="text-lg font-semibold">${pkg.price}</div>
                      <div className="text-xs text-muted-foreground">
                        ${(pkg.price / pkg.quantity).toFixed(0)} per slot
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to Stripe Checkout to complete your purchase. 
                Slots are available immediately after payment.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Selected Package:</span>
                <span className="font-medium">{selectedPackage.quantity} slots</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-medium">${selectedPackage.price}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setStep('check-slots')}
              >
                Back
              </Button>
              <Button onClick={handlePurchaseSlots} size="lg">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase {selectedPackage.quantity} Slots
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
