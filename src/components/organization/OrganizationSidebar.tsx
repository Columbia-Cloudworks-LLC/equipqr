
import React from 'react';
import { SessionOrganization } from '@/contexts/SessionContext';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import SlotBasedBilling from '@/components/billing/SlotBasedBilling';

interface OrganizationSidebarProps {
  organization: SessionOrganization;
  onUpgrade: () => void;
}

const OrganizationSidebar: React.FC<OrganizationSidebarProps> = ({
  organization,
  onUpgrade
}) => {
  const { data: members = [] } = useOrganizationMembers(organization?.id || '');
  const { data: fleetMapSubscription } = useFleetMapSubscription(organization?.id || '');

  const handlePurchaseSlots = (quantity: number) => {
    console.log('Purchase slots:', quantity);
    onUpgrade();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="lg:sticky lg:top-6">
        <SessionStatus />
      </div>
      <div className="lg:sticky lg:top-6">
        <SecurityStatus />
      </div>
      <div className="lg:sticky lg:top-6">
        <SlotBasedBilling
          storageUsedGB={0} // TODO: Get from organization data
          fleetMapEnabled={fleetMapSubscription?.enabled || false}
          onPurchaseSlots={handlePurchaseSlots}
          onUpgradeToMultiUser={onUpgrade}
        />
      </div>
    </div>
  );
};

export default OrganizationSidebar;
