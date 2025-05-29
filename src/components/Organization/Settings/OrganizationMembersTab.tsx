
import React from 'react';
import OrganizationMembersManagement from '@/components/Organization/OrganizationMembersManagement';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationMembersTabProps {
  organizationId: string;
  userRole: UserRole;
}

export function OrganizationMembersTab({ organizationId, userRole }: OrganizationMembersTabProps) {
  return (
    <OrganizationMembersManagement 
      organizationId={organizationId}
      userRole={userRole}
    />
  );
}
