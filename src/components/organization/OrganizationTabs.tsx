
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Crown, UserPlus } from 'lucide-react';
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { OrganizationAdmin } from '@/hooks/useOrganizationAdmins';
import { PagePermissions } from '@/hooks/usePagePermissions';
import MembersListReal from './MembersListReal';
import InvitationManagement from './InvitationManagement';
import AdminsTabContent from './AdminsTabContent';
import MemberLimitWarning from './MemberLimitWarning';

interface OrganizationTabsProps {
  members: RealOrganizationMember[];
  admins: OrganizationAdmin[];
  organizationId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  permissions: PagePermissions;
  membersLoading: boolean;
  adminsLoading: boolean;
  onInviteMember: () => void;
  onUpgrade: () => void;
}

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
  members,
  admins,
  organizationId,
  currentUserRole,
  permissions,
  membersLoading,
  adminsLoading,
  onInviteMember,
  onUpgrade
}) => {
  return (
    <Tabs defaultValue="members" className="space-y-4">
      <div className="overflow-x-auto">
        <TabsList className="grid w-full grid-cols-3 min-w-fit">
          <TabsTrigger value="members" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Members</span>
            <span className="xs:hidden">Members</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Invitations</span>
            <span className="xs:hidden">Invites</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Admins</span>
            <span className="xs:hidden">Admins</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="members" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Team Members</h2>
          {permissions.canInviteMembers && (
            <Button
              onClick={onInviteMember}
              disabled={permissions.isAtMemberLimit}
              size="sm"
              className="w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Invite Member</span>
            </Button>
          )}
        </div>
        
        {permissions.shouldShowMemberLimitWarning && (
          <MemberLimitWarning onUpgrade={onUpgrade} />
        )}

        <MembersListReal
          members={members}
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          isLoading={membersLoading}
        />
      </TabsContent>

      <TabsContent value="invitations">
        <InvitationManagement />
      </TabsContent>

      <TabsContent value="admins" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Organization Administrators</h2>
          <Badge variant="outline" className="text-xs sm:text-sm w-fit">
            {admins.length} Admin{admins.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <AdminsTabContent admins={admins} isLoading={adminsLoading} />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationTabs;
