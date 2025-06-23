
import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useOrganizationAdmins } from '@/hooks/useOrganizationAdmins';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationOverview from '@/components/organization/OrganizationOverview';
import OrganizationTabs from '@/components/organization/OrganizationTabs';
import OrganizationSidebar from '@/components/organization/OrganizationSidebar';
import EnhancedInviteMemberDialog from '@/components/organization/EnhancedInviteMemberDialog';
import { toast } from 'sonner';

const OrganizationEnhanced = () => {
  const { getCurrentOrganization, isLoading } = useSession();
  const currentOrganization = getCurrentOrganization();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Custom hooks for data and business logic
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: orgAdmins = [], isLoading: adminsLoading } = useOrganizationAdmins(currentOrganization?.id || '');
  const { data: slotAvailability } = useSlotAvailability(currentOrganization?.id || '');
  const organizationStats = useOrganizationStats(currentOrganization);
  const permissions = usePagePermissions(currentOrganization);

  const currentUserRole: 'owner' | 'admin' | 'member' = currentOrganization?.userRole || 'member';

  // Event handlers
  const handleUpgradeToPremium = () => {
    toast.success('Redirecting to billing page...');
    // In a real app, this would redirect to the billing page
  };

  const handleInviteMember = () => {
    setInviteDialogOpen(true);
  };

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

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <OrganizationHeader organizationName={currentOrganization.name} />

      <OrganizationOverview 
        organizationName={currentOrganization.name}
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

      <EnhancedInviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        availableSlots={slotAvailability?.available_slots || 0}
      />
    </div>
  );
};

export default OrganizationEnhanced;
