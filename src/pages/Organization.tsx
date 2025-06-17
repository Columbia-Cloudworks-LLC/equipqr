import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Settings, Building2 } from 'lucide-react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import MembersList from '@/components/organization/MembersList';
import InviteMemberDialog from '@/components/organization/InviteMemberDialog';
import PremiumFeatures from '@/components/organization/PremiumFeatures';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import { mockMembers } from '@/data/mockOrganization';
import { OrganizationMember, InvitationData } from '@/types/organization';
import { toast } from '@/hooks/use-toast';

const Organization = () => {
  const { currentOrganization, isLoading } = useSimpleOrganization();
  const [members, setMembers] = useState<OrganizationMember[]>(mockMembers);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Simulate current user role (in real app, this would come from auth)
  const currentUserRole: 'owner' | 'admin' | 'member' = 'owner';

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

  const handleInviteMember = async (data: InvitationData) => {
    setInviteLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMember: OrganizationMember = {
      id: `member-${Date.now()}`,
      name: data.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: data.email,
      role: data.role,
      joinedDate: new Date().toISOString(),
      status: 'pending',
    };

    setMembers(prev => [...prev, newMember]);

    setInviteLoading(false);
    toast({
      title: 'Invitation Sent',
      description: `An invitation has been sent to ${data.email}.`,
    });
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'member') => {
    setMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const handleResendInvitation = (memberId: string) => {
    console.log('Resending invitation for member:', memberId);
    toast({
      title: 'Invitation Resent',
      description: 'The invitation has been resent successfully.',
    });
  };

  const handleUpgradeToPremium = () => {
    toast({
      title: 'Upgrade to Premium',
      description: 'Redirecting to billing page...',
    });
  };

  const canInviteMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isAtMemberLimit = currentOrganization.memberCount >= currentOrganization.maxMembers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground">
            Manage {currentOrganization.name} members and settings
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{currentOrganization.memberCount}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
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
        {/* Members Management */}
        <div className="lg:col-span-2 space-y-4">
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

          <MembersList
            members={members}
            currentUserRole={currentUserRole}
            onRoleChange={handleRoleChange}
            onRemoveMember={handleRemoveMember}
            onResendInvitation={handleResendInvitation}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <SessionStatus />
          <SecurityStatus />
          <PremiumFeatures
            organization={currentOrganization}
            onUpgrade={handleUpgradeToPremium}
          />
        </div>
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInviteMember}
        isLoading={inviteLoading}
      />
    </div>
  );
};

export default Organization;
