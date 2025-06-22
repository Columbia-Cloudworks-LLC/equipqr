
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Settings, Building2, Mail, Users, Crown } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useOrganizationAdmins } from '@/hooks/useOrganizationAdmins';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import MembersListReal from '@/components/organization/MembersListReal';
import InvitationManagement from '@/components/organization/InvitationManagement';
import EnhancedInviteMemberDialog from '@/components/organization/EnhancedInviteMemberDialog';
import PremiumFeaturesReal from '@/components/organization/PremiumFeaturesReal';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import { toast } from 'sonner';

const OrganizationEnhanced = () => {
  const { getCurrentOrganization, isLoading } = useSession();
  const currentOrganization = getCurrentOrganization();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Get real organization members and admins
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: orgAdmins = [], isLoading: adminsLoading } = useOrganizationAdmins(currentOrganization?.id || '');

  const currentUserRole: 'owner' | 'admin' | 'member' = currentOrganization?.userRole || 'member';

  if (isLoading || !currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpgradeToPremium = () => {
    toast.success('Redirecting to billing page...');
    // In a real app, this would redirect to the billing page
  };

  const canInviteMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isAtMemberLimit = currentOrganization.memberCount >= currentOrganization.maxMembers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage {currentOrganization.name} members, invitations, and settings
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {currentOrganization.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{orgAdmins.length}</div>
              <div className="text-sm text-muted-foreground">Organization Admins</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge variant={currentOrganization.plan === 'premium' ? 'default' : 'secondary'}>
                {currentOrganization.plan === 'premium' ? 'Premium' : 'Free Plan'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Current Plan</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{currentOrganization.features.length}</div>
              <div className="text-sm text-muted-foreground">Active Features</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
                {canInviteMembers && (
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    disabled={isAtMemberLimit && currentOrganization.plan === 'free'}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>
              
              {isAtMemberLimit && currentOrganization.plan === 'free' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    You've reached the member limit for the free plan. 
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={handleUpgradeToPremium}>
                      Upgrade to Premium
                    </Button> 
                    to add more members.
                  </div>
                </div>
              )}

              <MembersListReal
                members={members}
                organizationId={currentOrganization.id}
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
                  {orgAdmins.length} Admin{orgAdmins.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  {adminsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">Loading administrators...</div>
                    </div>
                  ) : orgAdmins.length === 0 ? (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No administrators found</h3>
                      <p className="text-muted-foreground">
                        Invite members with admin privileges to help manage your organization.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orgAdmins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{admin.name}</h4>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                          <Badge variant={admin.role === 'owner' ? 'default' : 'secondary'}>
                            {admin.role === 'owner' ? 'Owner' : 'Admin'}
                          </Badge>
                        </div>
                      ))}
                      
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Work Order Assignment:</strong> These administrators can receive work order assignments 
                          for equipment that doesn't have an assigned team.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <SessionStatus />
          <SecurityStatus />
          <PremiumFeaturesReal
            organization={currentOrganization}
            onUpgrade={handleUpgradeToPremium}
          />
        </div>
      </div>

      <EnhancedInviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
};

export default OrganizationEnhanced;
