
import React from 'react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useOrganization';

export const OrganizationSwitcher: React.FC = () => {
  const { currentOrganization } = useOrganization();

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">
        <div className="font-medium">
          {currentOrganization?.name ?? 'No organization selected'}
        </div>
        {currentOrganization?.plan && (
          <div className="text-xs text-muted-foreground">
            {currentOrganization.plan} Plan
          </div>
        )}
      </div>
      <Button variant="outline" size="sm">Switch</Button>
    </div>
  );
};
