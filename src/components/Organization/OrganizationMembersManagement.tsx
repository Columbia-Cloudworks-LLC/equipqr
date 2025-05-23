
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OrganizationMembersTable } from './Members/OrganizationMembersTable';
import { useOrganizationMembers } from './Members/useOrganizationMembers';
import ErrorDisplay from './Members/ErrorDisplay';
import { UserRole } from '@/types/supabase-enums';
import OrganizationTabs from './Members/OrganizationTabs';

interface OrganizationMembersManagementProps {
  organizationId: string;
  userRole: UserRole;
}

const OrganizationMembersManagement: React.FC<OrganizationMembersManagementProps> = ({ 
  organizationId, 
  userRole 
}) => {
  const [activeTab, setActiveTab] = useState('members');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { 
    members, 
    loading, 
    error, 
    refreshData,
    updateMemberRole,
    refreshMembers
  } = useOrganizationMembers(organizationId, refreshTrigger);

  const isOwner = userRole === 'owner';

  const handleInviteSent = () => {
    // Increment the refresh trigger to reload members and invitations
    setRefreshTrigger(prev => prev + 1);
    // Switch to invitations tab after sending an invitation
    setActiveTab('invitations');
  };

  const handleMemberRoleUpdate = (memberId: string, newRole: string) => {
    // Update the member role immediately in the UI
    updateMemberRole(memberId, newRole);
  };

  const handleRefreshMembers = async () => {
    // Refresh members data from server
    await refreshMembers();
  };

  // If there's an error, show the error display
  if (error) {
    return <ErrorDisplay error={error} refreshData={refreshData} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          members={members}
          organizationId={organizationId}
          isOwner={isOwner}
          loading={loading}
          refreshTrigger={refreshTrigger}
          onInviteSent={handleInviteSent}
          onMemberRoleUpdate={handleMemberRoleUpdate}
          onRefreshMembers={handleRefreshMembers}
        />
      </CardContent>
    </Card>
  );
};

export default OrganizationMembersManagement;
