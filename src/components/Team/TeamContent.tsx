
import { useState, useEffect } from 'react';
import { TeamMembersList } from '@/components/Team/TeamMembersList';
import { TeamInvitationsList } from '@/components/Team/TeamInvitationsList';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { InviteForm } from '@/components/Team/InviteForm';
import { RepairTeamAccess } from '@/components/Team/RepairTeamAccess';
import { ViewerRoleAlert } from '@/components/Team/ViewerRoleAlert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

interface TeamContentProps {
  selectedTeamId: string;
  members: TeamMember[];
  pendingInvitations?: any[];
  teams: { id: string; name: string }[];
  isLoading: boolean;
  isLoadingInvitations?: boolean;
  isCreatingTeam: boolean;
  isRepairingTeam?: boolean;
  isUpgradingRole?: boolean;
  isRequestingRole?: boolean;
  isMember?: boolean;
  currentUserRole?: string;
  canChangeRoles?: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation?: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => void;
  onRepairTeam?: (teamId: string) => void;
  onUpgradeRole?: (teamId: string) => void;
  onRequestRoleUpgrade?: (teamId: string) => void;
  onFetchPendingInvitations?: () => void;
}

export function TeamContent({
  selectedTeamId,
  members,
  pendingInvitations = [],
  teams,
  isLoading,
  isLoadingInvitations = false,
  isCreatingTeam,
  isRepairingTeam = false,
  isUpgradingRole = false,
  isRequestingRole = false,
  isMember = true,
  currentUserRole,
  canChangeRoles = false,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation = async () => {},
  onCreateTeam,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations
}: TeamContentProps) {
  const [activeTab, setActiveTab] = useState('members');

  // Fetch pending invitations when the "Pending Invitations" tab is selected
  useEffect(() => {
    if (activeTab === 'pending' && onFetchPendingInvitations && selectedTeamId) {
      onFetchPendingInvitations();
    }
  }, [activeTab, selectedTeamId, onFetchPendingInvitations]);

  // Handle repair access case
  if (selectedTeamId && !isMember && onRepairTeam) {
    return <RepairTeamAccess 
      selectedTeamId={selectedTeamId} 
      onRepairTeam={onRepairTeam} 
      isRepairingTeam={isRepairingTeam} 
    />;
  }

  // Handle viewer role with upgrade option
  if (selectedTeamId && isMember && currentUserRole === 'viewer') {
    return <ViewerRoleAlert 
      selectedTeamId={selectedTeamId}
      isUpgradingRole={isUpgradingRole}
      isRequestingRole={isRequestingRole}
      canChangeRoles={canChangeRoles}
      onUpgradeRole={onUpgradeRole}
      onRequestRoleUpgrade={onRequestRoleUpgrade}
      onCreateTeam={onCreateTeam}
      isCreatingTeam={isCreatingTeam}
      members={members}
    />;
  }

  return (
    <Tabs defaultValue="members" className="w-full" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="members">Team Members</TabsTrigger>
        <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
        <TabsTrigger value="invite">Invite People</TabsTrigger>
        <TabsTrigger value="create">Create Team</TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        {selectedTeamId ? (
          <TeamMembersList
            members={members}
            onRemoveMember={onRemoveMember}
            onChangeRole={onChangeRole}
            onResendInvite={onResendInvite}
            teamId={selectedTeamId}
          />
        ) : (
          <p>Select a team to view members</p>
        )}
      </TabsContent>
      
      <TabsContent value="pending" className="mt-6">
        {selectedTeamId ? (
          <TeamInvitationsList
            invitations={pendingInvitations}
            onResendInvite={onResendInvite}
            onCancelInvite={onCancelInvitation}
            isLoading={isLoadingInvitations}
          />
        ) : (
          <p>Select a team to view pending invitations</p>
        )}
      </TabsContent>
      
      <TabsContent value="invite" className="mt-6 max-w-md">
        <InviteForm 
          onInvite={onInviteMember} 
          isLoading={isLoading}
          teams={teams}
        />
      </TabsContent>
      
      <TabsContent value="create" className="mt-6 max-w-md">
        <TeamCreationForm 
          onCreateTeam={onCreateTeam}
          isLoading={isCreatingTeam}
        />
      </TabsContent>
    </Tabs>
  );
}
