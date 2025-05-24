
import { UserRole } from '@/types/supabase-enums';
import { TeamMembers } from './TeamMembers';
import { TeamSettings } from './TeamSettings';
import { MembershipAlert } from './MembershipAlert';
import { ViewerRoleAlert } from './ViewerRoleAlert';
import { RepairTeamAccess } from './RepairTeamAccess';
import { TeamEquipmentMap } from './TeamEquipmentMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Team } from '@/services/team';

interface TeamContentProps {
  selectedTeamId: string;
  members: any[];
  pendingInvitations: any[];
  teams: Team[];
  isLoading: boolean;
  isLoadingInvitations: boolean;
  isCreatingTeam: boolean;
  isUpdatingTeam: boolean;
  isDeletingTeam: boolean;
  isRepairingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  isMember: boolean;
  currentUserRole: string | null;
  canChangeRoles: boolean;
  onInviteMember: (email: string, role: UserRole) => Promise<any>;
  onChangeRole: (userId: string, role: string) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => Promise<any>;
  onUpdateTeam: (id: string, name: string) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>;
  onRepairTeam: () => Promise<void>;
  onUpgradeRole: () => Promise<void>;
  onRequestRoleUpgrade: () => Promise<void>;
  onFetchPendingInvitations: () => Promise<any>;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamContent({
  selectedTeamId,
  members,
  pendingInvitations,
  teams,
  isLoading,
  isLoadingInvitations,
  isCreatingTeam,
  isUpdatingTeam,
  isDeletingTeam,
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
  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const teamName = selectedTeam?.name || 'Unknown Team';

  if (!isMember && currentUserRole !== 'owner' && currentUserRole !== 'manager') {
    return (
      <div className="space-y-4">
        <MembershipAlert 
          teamName={teamName}
          onRepair={onRepairTeam}
          isRepairing={isRepairingTeam}
          role={currentUserRole}
        />
        <RepairTeamAccess 
          selectedTeamId={selectedTeamId}
          onRepairTeam={onRepairTeam}
          isRepairingTeam={isRepairingTeam}
          teamDetails={selectedTeam}
        />
      </div>
    );
  }

  const isViewerOnly = isMember && currentUserRole === 'viewer';

  if (isViewerOnly) {
    return (
      <div className="space-y-4">
        <ViewerRoleAlert
          canUpgrade={canChangeRoles}
          isUpgrading={isUpgradingRole}
          isRequesting={isRequestingRole}
          onUpgrade={onUpgradeRole}
          onRequest={onRequestRoleUpgrade}
        />
        
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="locations">Equipment Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <TeamMembers
              teamId={selectedTeamId}
              teamName={teamName}
              members={members}
              isLoading={isLoading}
              currentUserRole={currentUserRole}
              isMember={isMember}
              canChangeRoles={false}
              isUpgradingRole={isUpgradingRole}
              isRequestingRole={isRequestingRole}
              onInviteMember={onInviteMember}
              onChangeRole={onChangeRole}
              onRemoveMember={onRemoveMember}
              onUpgradeRole={onUpgradeRole}
              onRequestRoleUpgrade={onRequestRoleUpgrade}
              isRepairingTeam={isRepairingTeam}
              onRepairTeam={onRepairTeam}
            />
          </TabsContent>
          
          <TabsContent value="locations">
            <TeamEquipmentMap teamId={selectedTeamId} teamName={teamName} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="locations">Equipment Locations</TabsTrigger>
          <TabsTrigger value="settings">Team Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <TeamMembers
            teamId={selectedTeamId}
            teamName={teamName}
            members={members}
            isLoading={isLoading}
            currentUserRole={currentUserRole}
            isMember={isMember}
            canChangeRoles={canChangeRoles}
            isUpgradingRole={isUpgradingRole}
            isRequestingRole={isRequestingRole}
            onInviteMember={onInviteMember}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            onUpgradeRole={onUpgradeRole}
            onRequestRoleUpgrade={onRequestRoleUpgrade}
            isRepairingTeam={isRepairingTeam}
            onRepairTeam={onRepairTeam}
          />
        </TabsContent>
        
        <TabsContent value="locations">
          <TeamEquipmentMap teamId={selectedTeamId} teamName={teamName} />
        </TabsContent>
        
        <TabsContent value="settings">
          <TeamSettings
            team={selectedTeam}
            isUpdating={isUpdatingTeam}
            isDeleting={isDeletingTeam}
            onUpdateTeam={onUpdateTeam}
            onDelete={onDeleteTeam}
            currentUserRole={currentUserRole}
            getTeamEquipmentCount={getTeamEquipmentCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
