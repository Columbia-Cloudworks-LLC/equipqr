
import React, { useState } from 'react';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { useOrganizationAdmins } from '@/hooks/useOrganizationAdmins';
import { useOptimizedOrganizationMembers } from '@/hooks/useOptimizedOrganizationMembers';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { usePagePermissions } from '@/hooks/usePagePermissions';

import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationTabs from '@/components/organization/OrganizationTabs';
import { OrganizationSettingsDialog } from '@/components/organization/OrganizationSettingsDialog';
import RestrictedOrganizationAccess from '@/components/organization/RestrictedOrganizationAccess';
import { calculateBilling } from '@/utils/billing';
import { toast } from 'sonner';

const Organization = () => {
  const { currentOrganization, isLoading } = useSimpleOrganization();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Custom hooks for data and business logic
  const { data: members = [], isLoading: membersLoading } = useOptimizedOrganizationMembers(currentOrganization?.id || '');
  const { data: orgAdmins = [], isLoading: adminsLoading } = useOrganizationAdmins(currentOrganization?.id || '');
  const { data: fleetMapSubscription } = useFleetMapSubscription(currentOrganization?.id || '');
  const organizationStats = useOrganizationStats(currentOrganization);
  const permissions = usePagePermissions(currentOrganization);
  

  const currentUserRole: 'owner' | 'admin' | 'member' = currentOrganization?.userRole || 'member';

  // Loading state
  if (isLoading || !currentOrganization) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organization</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Restrict access for regular members
  if (currentUserRole === 'member') {
    return (
      <RestrictedOrganizationAccess 
        currentOrganizationName={currentOrganization.name}
      />
    );
  }

  // Event handlers
  const handleSettingsClick = () => {
    setSettingsDialogOpen(true);
  };

  const handleUpgradeToPremium = () => {
    const billing = calculateBilling({ members, storageGB: 0, fleetMapEnabled: false });
    if (billing.userLicenses.totalUsers === 1) {
      toast.info('Invite team members to unlock collaboration features at $10/month per additional user.');
    } else {
      toast.success('Redirecting to billing page...');
    }
  };

  const handleInviteMember = () => {
    // This is now handled by the unified dialog in OrganizationTabs
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <OrganizationHeader 
        organizationName={currentOrganization.name}
        onSettingsClick={handleSettingsClick}
        currentUserRole={currentUserRole}
      />

      <OrganizationTabs
        members={members}
        admins={orgAdmins}
        organizationId={currentOrganization.id}
        currentUserRole={currentUserRole}
        permissions={permissions}
        membersLoading={membersLoading}
        adminsLoading={adminsLoading}
        onInviteMember={handleInviteMember}
        onUpgrade={handleUpgradeToPremium}
        organization={currentOrganization}
        organizationStats={organizationStats}
        fleetMapSubscription={fleetMapSubscription}
      />

      <OrganizationSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        organization={currentOrganization}
        currentUserRole={currentUserRole}
      />
    </div>
  );
};

export default Organization;
