
import React from 'react';
import { SessionOrganization } from '@/contexts/SessionContext';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import PremiumFeaturesReal from './PremiumFeaturesReal';

interface OrganizationSidebarProps {
  organization: SessionOrganization;
  onUpgrade: () => void;
}

const OrganizationSidebar: React.FC<OrganizationSidebarProps> = ({
  organization,
  onUpgrade
}) => {
  return (
    <div className="space-y-6">
      <SessionStatus />
      <SecurityStatus />
      <PremiumFeaturesReal
        organization={organization}
        onUpgrade={onUpgrade}
      />
    </div>
  );
};

export default OrganizationSidebar;
