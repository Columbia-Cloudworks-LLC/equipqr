
import { useState } from 'react';
import { TeamMembersList } from './TeamMembersList';
import { TeamInvitationsList } from './TeamInvitationsList';
import { InviteMemberButton } from './InviteMemberButton';
import { MembershipAlert } from './MembershipAlert';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, Mail } from 'lucide-react';

interface TeamContentProps {
  selectedTeamId: string;
  members: any[];
  pendingInvitations: any[];
  teams: any[];
  isLoading: boolean;
  isLoadingInvitations: boolean;
  isCreatingTeam: boolean;
  isRepairingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  isMember: boolean;
  currentUserRole: string | null;
  canChangeRoles: boolean;
  onInviteMember: (email: string, role: string, teamId: string) => void;
  onChangeRole: (id: string, role: string, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => void;
  onRepairTeam: (teamId: string) => void;
  onUpgradeRole: (teamId: string) => void;
  onRequestRoleUpgrade: (teamId: string) => void;
  onFetchPendingInvitations: () => void;
}

export function TeamContent({
  selectedTeamId,
  members,
  pendingInvitations,
  teams,
  isLoading,
  isLoadingInvitations,
  isCreatingTeam,
  isRepairingTeam,
  isUpgradingRole,
  isRequestingRole,
  isMember,
  currentUserRole,
  canChangeRoles,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation,
  onCreateTeam,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations
}: TeamContentProps) {
  const [activeTab, setActiveTab] = useState('members');

  // Only show content if a team is selected
  if (!selectedTeamId) {
    return null;
  }
  
  // Get current selected team details
  const currentTeam = teams.find(team => team.id === selectedTeamId);
  const isExternalOrg = currentTeam?.is_external_org;
  const orgName = currentTeam?.org_name;
  
  // Determine if the user can manage members (manager role or higher)
  const canManageMembers = !isExternalOrg && (
    currentUserRole === 'manager' || 
    currentUserRole === 'admin' || 
    currentUserRole === 'owner' ||
    canChangeRoles
  );
  
  // If user is not a member and not repairing, show membership alert
  if (!isMember && !isRepairingTeam) {
    return (
      <MembershipAlert
        team={teams.find(t => t.id === selectedTeamId)}
        onRepair={() => onRepairTeam(selectedTeamId)}
        isRepairing={isRepairingTeam}
        role={currentUserRole}
        onUpgrade={() => onUpgradeRole(selectedTeamId)}
        onRequestUpgrade={() => onRequestRoleUpgrade(selectedTeamId)}
        isUpgrading={isUpgradingRole}
        isRequesting={isRequestingRole}
        canUpgrade={canChangeRoles}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{currentTeam?.name || 'Team'}</h2>
          {orgName && (
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Building className="h-3.5 w-3.5 mr-1" />
              {orgName}
              {isExternalOrg && (
                <Badge variant="outline" className="ml-2 text-xs">
                  External Organization
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {canManageMembers && (
          <InviteMemberButton
            onInvite={(email, role) => onInviteMember(email, role, selectedTeamId)}
            teams={teams}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="invitations" 
            className="flex items-center"
            onClick={onFetchPendingInvitations}
          >
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-4">
          <TeamMembersList
            members={members}
            onRemoveMember={(id) => onRemoveMember(id, selectedTeamId)}
            onChangeRole={(id, role) => onChangeRole(id, role, selectedTeamId)}
            onResendInvite={onResendInvite}
            teamId={selectedTeamId}
            isViewOnly={!canManageMembers}
          />
        </TabsContent>
        <TabsContent value="invitations" className="mt-4">
          <TeamInvitationsList
            invitations={pendingInvitations}
            onResendInvite={onResendInvite}
            onCancelInvite={onCancelInvitation}
            isLoading={isLoadingInvitations}
            isViewOnly={!canManageMembers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
