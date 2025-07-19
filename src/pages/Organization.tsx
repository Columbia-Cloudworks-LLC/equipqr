
import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useOrganizationAdmins } from '@/hooks/useOrganizationAdmins';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/hooks/useSimplifiedOrganizationRestrictions';
import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationOverview from '@/components/organization/OrganizationOverview';
import OrganizationTabs from '@/components/organization/OrganizationTabs';
import OrganizationSidebar from '@/components/organization/OrganizationSidebar';
import { OrganizationSettingsDialog } from '@/components/organization/OrganizationSettingsDialog';
import { calculateSimplifiedBilling } from '@/utils/simplifiedBillingUtils';
import { toast } from 'sonner';

const Organization = () => {
  const { getCurrentOrganization, isLoading } = useSession();
  const currentOrganization = getCurrentOrganization();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Custom hooks for data and business logic
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: orgAdmins = [], isLoading: adminsLoading } = useOrganizationAdmins(currentOrganization?.id || '');
  const { data: fleetMapSubscription } = useFleetMapSubscription(currentOrganization?.id || '');
  const organizationStats = useOrganizationStats(currentOrganization);
  const permissions = usePagePermissions(currentOrganization);
  const { restrictions } = useSimplifiedOrganizationRestrictions(fleetMapSubscription?.enabled || false);

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

  // Event handlers
  const handleSettingsClick = () => {
    setSettingsDialogOpen(true);
  };

  const handleUpgradeToPremium = () => {
    const billing = calculateSimplifiedBilling(members);
    if (billing.userLicenses.totalUsers === 1) {
      toast.info('Invite team members to unlock collaboration features at $10/month per additional user.');
    } else {
      toast.success('Redirecting to billing page...');
    }
  };

  const handleInviteMember = () => {
    // This is now handled by the unified dialog in OrganizationTabs
    console.log('Invite member action triggered');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <OrganizationHeader 
        organizationName={currentOrganization.name}
        onSettingsClick={handleSettingsClick}
        currentUserRole={currentUserRole}
      />

      <OrganizationOverview 
        organizationName={currentOrganization.name}
        organizationId={currentOrganization.id}
        stats={organizationStats}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6 min-w-0">
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
          />
        </div>

        <div className="xl:col-span-1 min-w-0">
          <OrganizationSidebar
            organization={currentOrganization}
            onUpgrade={handleUpgradeToPremium}
          />
        </div>
      </div>

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
