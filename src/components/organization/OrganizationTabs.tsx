
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Crown, UserPlus, ShoppingCart } from 'lucide-react';
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { OrganizationAdmin } from '@/hooks/useOrganizationAdmins';
import { PagePermissions } from '@/hooks/usePagePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/hooks/useSimplifiedOrganizationRestrictions';
import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import { calculateSimplifiedBilling } from '@/utils/simplifiedBillingUtils';
import MembersListReal from './MembersListReal';
import AdminsTabContent from './AdminsTabContent';
import SimplifiedInvitationDialog from './SimplifiedInvitationDialog';

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
  onUpgrade
}) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { data: fleetMapSubscription } = useFleetMapSubscription(organizationId);
  const { restrictions } = useSimplifiedOrganizationRestrictions(fleetMapSubscription?.enabled || false);
  const billing = calculateSimplifiedBilling(members);

  const handleInviteMember = () => {
    setInviteDialogOpen(true);
  };

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
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Team Members</h2>
            <Badge variant="outline">
              {billing.userLicenses.totalUsers} total • ${billing.userLicenses.totalCost}/month
            </Badge>
          </div>
          {restrictions.canInviteMembers && restrictions.hasAvailableSlots && (
            <div className="flex gap-2">
              <Button
                onClick={handleInviteMember}
                size="sm"
                className="w-full sm:w-auto"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Invite Member</span>
              </Button>
            </div>
          )}
          {!restrictions.hasAvailableSlots && billing.userLicenses.totalUsers !== 1 && (
            <div className="flex gap-2">
              <Button
                onClick={onUpgrade}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="sm:inline">Purchase Licenses</span>
              </Button>
            </div>
          )}
        </div>
        
          {billing.userLicenses.totalUsers === 1 && !restrictions.hasAvailableSlots && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>License-based collaboration:</strong> Purchase user license subscriptions to invite team members and unlock collaboration features. 
                You pay monthly for a set number of licenses, then invite users up to that limit.
              </div>
            </div>
          )}

        {!restrictions.hasAvailableSlots && billing.userLicenses.totalUsers > 1 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm text-orange-800">
              <strong>No available licenses:</strong> You've used all your purchased user licenses. 
              Purchase additional licenses to invite more team members.
            </div>
          </div>
        )}

        <MembersListReal
          members={members}
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          isLoading={membersLoading}
        />
      </TabsContent>

      <TabsContent value="invitations">
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Invitations</h2>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">
              Send invitations to join your organization. Each invitation uses one of your purchased user licenses. 
              You can manage your license subscriptions from the billing page.
            </div>
          </div>
        </div>
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

      <SimplifiedInvitationDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </Tabs>
  );
};

export default OrganizationTabs;
