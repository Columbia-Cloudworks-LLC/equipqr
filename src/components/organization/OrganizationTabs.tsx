
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Crown, UserPlus, BarChart3, CreditCard, Shield } from 'lucide-react';
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { OrganizationAdmin } from '@/hooks/useOrganizationAdmins';
import { PagePermissions } from '@/hooks/usePagePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/hooks/useSimplifiedOrganizationRestrictions';

import { calculateSimplifiedBilling } from '@/utils/simplifiedBillingUtils';
import MembersListReal from './MembersListReal';
import AdminsTabContent from './AdminsTabContent';
import SimplifiedInvitationDialog from './SimplifiedInvitationDialog';
import InvitationManagement from './InvitationManagement';
import PurchaseLicensesButton from '@/components/billing/PurchaseLicensesButton';
import ManageSubscriptionButton from '@/components/billing/ManageSubscriptionButton';
import SlotBasedBilling from '@/components/billing/SlotBasedBilling';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  organization: any;
  organizationStats: any;
  fleetMapSubscription: any;
}

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
  members,
  admins,
  organizationId,
  currentUserRole,
  permissions,
  membersLoading,
  adminsLoading,
  onUpgrade,
  organization,
  organizationStats,
  fleetMapSubscription
}) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { restrictions } = useSimplifiedOrganizationRestrictions(fleetMapSubscription?.enabled || false);
  const billing = calculateSimplifiedBilling(members);

  // Combine role-based permissions with organizational restrictions
  const canInviteMembers = permissions.canInviteMembers && restrictions.canInviteMembers && restrictions.hasAvailableSlots;
  const canShowPurchaseLicenses = permissions.canInviteMembers && restrictions.canInviteMembers && !restrictions.hasAvailableSlots;
  const canShowManageSubscription = permissions.canInviteMembers; // Only admins can manage subscriptions

  const handleInviteMember = () => {
    setInviteDialogOpen(true);
  };

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    setActiveTab("invitations"); // Switch to invitations tab after successful invite
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="overflow-x-auto">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 min-w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Over</span>
            <span className="hidden sm:inline">Overview</span>
            <span className="xs:hidden sm:hidden">O</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Mem</span>
            <span className="hidden sm:inline">Members</span>
            <span className="xs:hidden sm:hidden">M</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Inv</span>
            <span className="hidden sm:inline">Invitations</span>
            <span className="xs:hidden sm:hidden">I</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Bill</span>
            <span className="hidden sm:inline">Billing</span>
            <span className="xs:hidden sm:hidden">B</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Sec</span>
            <span className="hidden sm:inline">Security</span>
            <span className="xs:hidden sm:hidden">S</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
            <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Adm</span>
            <span className="hidden sm:inline">Admins</span>
            <span className="xs:hidden sm:hidden">A</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:gap-6">
          {/* Organization Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Members</CardTitle>
                <CardDescription>Active team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizationStats.memberCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Admins</CardTitle>
                <CardDescription>Organization administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizationStats.adminCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plan</CardTitle>
                <CardDescription>Current subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{organizationStats.plan}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Features</CardTitle>
                <CardDescription>Available features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizationStats.featureCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common organization management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {canInviteMembers && (
                  <Button onClick={handleInviteMember} variant="default">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                )}
                {canShowManageSubscription && (
                  <ManageSubscriptionButton variant="outline" />
                )}
                {canShowPurchaseLicenses && (
                  <PurchaseLicensesButton variant="outline" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fleet Map Status */}
          {fleetMapSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>Fleet Map</CardTitle>
                <CardDescription>Premium add-on status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={fleetMapSubscription.enabled ? "default" : "secondary"}>
                    {fleetMapSubscription.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="members" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Team Members</h2>
            <Badge variant="outline">
              {billing.userLicenses.totalUsers} total • ${billing.userLicenses.totalCost}/month
            </Badge>
          </div>
          {canInviteMembers && (
            <div className="flex gap-2">
              <Button
                onClick={handleInviteMember}
                size="sm"
                className="w-full sm:w-auto"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Invite Member</span>
              </Button>
              {canShowManageSubscription && (
                <ManageSubscriptionButton size="sm" variant="outline" />
              )}
            </div>
          )}
          {canShowPurchaseLicenses && billing.userLicenses.totalUsers !== 1 && (
            <div className="flex gap-2">
              <PurchaseLicensesButton
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              />
              {canShowManageSubscription && (
                <ManageSubscriptionButton size="sm" variant="outline" />
              )}
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

        {/* Show role-based restriction message for members */}
        {!permissions.canInviteMembers && currentUserRole === 'member' && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              <strong>Permission required:</strong> Only organization owners and admins can invite members and manage billing.
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
        <InvitationManagement />
      </TabsContent>

      <TabsContent value="billing" className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Billing & Licenses</h2>
            <p className="text-sm text-muted-foreground">Manage your organization's billing and user licenses</p>
          </div>
          <SlotBasedBilling
            storageUsedGB={0} // TODO: Get from organization data
            fleetMapEnabled={fleetMapSubscription?.enabled || false}
            onPurchaseSlots={(quantity) => onUpgrade()}
            onUpgradeToMultiUser={onUpgrade}
          />
        </div>
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Security & Status</h2>
            <p className="text-sm text-muted-foreground">Monitor your organization's security and session status</p>
          </div>
          <div className="space-y-4">
            <SessionStatus />
            <SecurityStatus />
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
        onSuccess={handleInviteSuccess}
      />
    </Tabs>
  );
};

export default OrganizationTabs;
