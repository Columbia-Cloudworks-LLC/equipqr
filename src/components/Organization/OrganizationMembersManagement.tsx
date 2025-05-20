
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';
import ErrorDisplay from './Members/ErrorDisplay';
import OrganizationTabs from './Members/OrganizationTabs';
import { useOrganizationMembers } from './Members/useOrganizationMembers';
import { InvitationStatusChecker } from './InvitationStatusChecker';

interface OrganizationMembersManagementProps {
  organizationId: string;
  userRole?: UserRole;
}

const OrganizationMembersManagement: React.FC<OrganizationMembersManagementProps> = ({ 
  organizationId, 
  userRole = 'viewer' 
}) => {
  const {
    members,
    loading,
    error,
    refreshTrigger,
    activeTab,
    setActiveTab,
    refreshData,
    handleInviteSent
  } = useOrganizationMembers(organizationId);

  const isOwner = userRole === 'owner';
  const isAdmin = isOwner || userRole === 'manager';

  // Show error state if there is an error
  if (error) {
    return <ErrorDisplay error={error} refreshData={refreshData} />;
  }

  // Otherwise show the main content
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organization Members</CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
          <CardDescription>
            Manage members and send invitations to your organization
          </CardDescription>
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
          />
        </CardContent>
      </Card>
      
      {/* Only show the debug tool for owners and managers */}
      {isAdmin && (
        <InvitationStatusChecker orgId={organizationId} />
      )}
    </>
  );
};

export default OrganizationMembersManagement;
