
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CreditCard, Users } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';
import { useBillingAwareInvitations } from '@/hooks/useBillingAwareInvitations';
import { BillingConfirmationDialog } from '@/components/Billing/BillingConfirmationDialog';
import { OrganizationMembersList } from './OrganizationMembersList';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';

interface OrganizationMembersTabProps {
  organizationId: string;
  userRole: UserRole;
}

export function OrganizationMembersTab({ organizationId, userRole }: OrganizationMembersTabProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    members,
    pendingInvitations,
    isLoading,
    isInviting,
    handleInviteMember,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    refetchMembers
  } = useOrganizationMembers(organizationId);

  const {
    showBillingDialog,
    pendingInvitation,
    billingImpact,
    checkBillingImpact,
    confirmInvitation,
    cancelInvitation
  } = useBillingAwareInvitations();

  const canManageMembers = userRole === 'owner' || userRole === 'manager';

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
        await handleInviteMember(email.trim(), role);
        setEmail('');
        setRole('manager');
      },
      [role],
      1
    );
  };

  return (
    <div className="space-y-6">
      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    disabled={isInviting}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isInviting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
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
                disabled={isInviting}
                className="w-full md:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationMembersList
            members={members}
            pendingInvitations={pendingInvitations}
            isLoading={isLoading}
            canManage={canManageMembers}
            onRemoveMember={handleRemoveMember}
            onResendInvite={handleResendInvite}
            onCancelInvitation={handleCancelInvitation}
            onRefetch={refetchMembers}
          />
        </CardContent>
      </Card>

      {billingImpact && (
        <BillingConfirmationDialog
          open={showBillingDialog}
          onOpenChange={cancelInvitation}
          onConfirm={confirmInvitation}
          billingImpact={billingImpact}
          invitationCount={pendingInvitation?.count || 1}
          isLoading={isInviting}
        />
      )}
    </div>
  );
}
