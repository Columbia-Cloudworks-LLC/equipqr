
import { useState, useEffect } from 'react';
import { TeamMembersList } from './TeamMembersList';
import { TeamInvitationsList } from './TeamInvitationsList';
import { InviteMemberButton } from './InviteMemberButton';
import { MembershipAlert } from './MembershipAlert';
import { EditTeamButton } from './EditTeamButton';
import { DeleteTeamButton } from './DeleteTeamButton';
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
  isUpdatingTeam?: boolean;
  isDeletingTeam?: boolean;
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
  onUpdateTeam: (teamId: string, name: string) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  onRepairTeam: (teamId: string) => void;
  onUpgradeRole: (teamId: string) => void;
  onRequestRoleUpgrade: (teamId: string) => void;
  onFetchPendingInvitations: () => void;
  getTeamEquipmentCount?: (teamId: string) => Promise<number>;
}

export function TeamContent({
  selectedTeamId,
  members,
  pendingInvitations,
  teams,
  isLoading,
  isLoadingInvitations,
  isCreatingTeam,
  isUpdatingTeam = false,
  isDeletingTeam = false,
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
  onUpdateTeam,
  onDeleteTeam,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations,
  getTeamEquipmentCount
}: TeamContentProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);
  
  // Get equipment count when team is selected
  useEffect(() => {
    const fetchEquipmentCount = async () => {
      if (selectedTeamId && getTeamEquipmentCount) {
        const count = await getTeamEquipmentCount(selectedTeamId);
        setEquipmentCount(count);
      }
    };
    
    fetchEquipmentCount();
  }, [selectedTeamId, getTeamEquipmentCount]);

  // Only show content if a team is selected
  if (!selectedTeamId) {
    return null;
  }
  
  // Get current selected team details
  const currentTeam = teams.find(team => team.id === selectedTeamId);
  const isExternalOrg = currentTeam?.is_external_org;
  const orgName = currentTeam?.org_name;
  
  // Determine if the user can manage members (manager role or higher)
  const managerRoles = ['manager', 'admin', 'owner', 'creator'];
  const canManageMembers = currentUserRole ? managerRoles.includes(currentUserRole) : canChangeRoles;
  
  // For logging purposes
  console.log("Team Content render - user role:", currentUserRole, "canManageMembers:", canManageMembers);
  
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

  // Only show viewer warning if the role is actually 'viewer'
  const isViewOnly = currentUserRole === 'viewer';

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
        
        <div className="flex gap-2">
          {canManageMembers && (
            <>
              <EditTeamButton 
                teamId={selectedTeamId}
                teamName={currentTeam?.name || ''}
                onUpdateTeam={onUpdateTeam}
                isLoading={isUpdatingTeam}
              />
              
              <DeleteTeamButton 
                teamId={selectedTeamId}
                teamName={currentTeam?.name || ''}
                onDeleteTeam={onDeleteTeam}
                isDeleting={isDeletingTeam}
                hasEquipment={!!equipmentCount && equipmentCount > 0}
                equipmentCount={equipmentCount || 0}
              />
              
              <InviteMemberButton
                onInvite={(email, role) => onInviteMember(email, role, selectedTeamId)}
                teams={teams}
              />
            </>
          )}
        </div>
      </div>

      {/* Only show viewer warning if the role is actually 'viewer' */}
      {isViewOnly && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 flex items-start gap-2">
          <div className="shrink-0 h-5 w-5 text-amber-500">⚠️</div>
          <p className="text-sm">You are in view-only mode. You need a manager role to make changes.</p>
        </div>
      )}

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
