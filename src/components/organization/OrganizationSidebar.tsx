
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
    <div className="space-y-4 sm:space-y-6">
      <div className="lg:sticky lg:top-6">
        <SessionStatus />
      </div>
      <div className="lg:sticky lg:top-6">
        <SecurityStatus />
      </div>
      <div className="lg:sticky lg:top-6">
        <PremiumFeaturesReal
          organization={organization}
          onUpgrade={onUpgrade}
        />
      </div>
    </div>
  );
};

export default OrganizationSidebar;
