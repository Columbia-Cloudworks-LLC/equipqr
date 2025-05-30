
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Mail, CreditCard } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';
import { useBillingAwareInvitations } from '@/hooks/useBillingAwareInvitations';
import { BillingConfirmationDialog } from '@/components/Billing/BillingConfirmationDialog';

interface InviteMemberFormProps {
  onInvite: (email: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function InviteMemberForm({ onInvite, isLoading, disabled = false }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    showBillingDialog,
    pendingInvitation,
    billingImpact,
    checkBillingImpact,
    confirmInvitation,
    cancelInvitation
  } = useBillingAwareInvitations();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setValidationError(null);

    // Use billing-aware invitation check
    await checkBillingImpact(
      async () => {
        await onInvite(email.trim(), role);
        setEmail('');
        setRole('manager');
      },
      [role],
      1
    );
  };

  const isFormDisabled = disabled || isLoading;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              disabled={isFormDisabled}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isFormDisabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            All organization members are charged $10/month, regardless of role.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          disabled={isFormDisabled}
          className="w-full md:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
        </Button>
      </form>

      {billingImpact && (
        <BillingConfirmationDialog
          open={showBillingDialog}
          onOpenChange={cancelInvitation}
          onConfirm={confirmInvitation}
          billingImpact={billingImpact}
          invitationCount={pendingInvitation?.count || 1}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
