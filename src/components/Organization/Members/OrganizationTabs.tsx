
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationMembersTable } from './OrganizationMembersTable';
import OrganizationInvitation from '../OrganizationInvitation';
import PendingOrganizationInvitations from '../PendingOrganizationInvitations';
import { OrganizationMember } from '@/services/organization/types';

interface OrganizationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  members: OrganizationMember[];
  organizationId: string;
  isOwner: boolean;
  loading: boolean;
  refreshTrigger: number;
  onInviteSent: () => void;
  onMemberRoleUpdate?: (memberId: string, newRole: string) => void;
  onRefreshMembers?: () => Promise<void>;
}

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
  activeTab,
  setActiveTab,
  members,
  organizationId,
  isOwner,
  loading,
  refreshTrigger,
  onInviteSent,
  onMemberRoleUpdate,
  onRefreshMembers
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 w-full mb-4">
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="invitations">Invitations</TabsTrigger>
        <TabsTrigger value="invite" disabled={!isOwner}>Invite</TabsTrigger>
      </TabsList>
      
      <TabsContent value="members">
        <OrganizationMembersTable 
          members={members} 
          isOwner={isOwner} 
          loading={loading}
          organizationId={organizationId}
          onMemberRoleUpdate={onMemberRoleUpdate}
          onRefreshMembers={onRefreshMembers}
        />
      </TabsContent>
      
      <TabsContent value="invitations">
        <PendingOrganizationInvitations 
          organizationId={organizationId} 
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>
      
      <TabsContent value="invite">
        <OrganizationInvitation 
          organizationId={organizationId}
          onInviteSent={onInviteSent}
        />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationTabs;
