
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
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members
        </TabsTrigger>
        <TabsTrigger value="invitations" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Invitations
        </TabsTrigger>
        <TabsTrigger value="admins" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Admins
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team Members</h2>
          {permissions.canInviteMembers && (
            <Button
              onClick={onInviteMember}
              disabled={permissions.isAtMemberLimit}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Organization Administrators</h2>
          <Badge variant="outline" className="text-sm">
            {admins.length} Admin{admins.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <AdminsTabContent admins={admins} isLoading={adminsLoading} />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationTabs;
