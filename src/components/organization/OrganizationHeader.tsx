
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface OrganizationHeaderProps {
  organizationName: string;
}

const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({ organizationName }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
        <p className="text-muted-foreground">
          Manage {organizationName} members, invitations, and settings
        </p>
      </div>
      <Button variant="outline" size="sm">
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>
    </div>
  );
};

export default OrganizationHeader;
