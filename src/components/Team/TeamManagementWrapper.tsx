
import { TeamSelector } from './TeamSelector';
import { TeamContent } from './TeamContent';
import { CreateTeamButton } from './CreateTeamButton';
import { UserRole } from '@/types/supabase-enums';
import { Team } from '@/services/team';
import { Organization } from '@/types';

interface TeamManagementWrapperProps {
  filteredTeams: Team[];
  selectedTeamId: string;
  selectedOrgId?: string;
  selectedOrganization?: Organization | null;
  members: any[];
  pendingInvitations: any[];
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
  isChangingOrg: boolean;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<any>;
  onUpdateTeam: (teamId: string, data: { name: string }) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>;
  onInviteMember: (email: string, role: UserRole) => Promise<any>;
  onChangeRole: (userId: string, role: string) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  onRepairTeam: () => Promise<void>;
  onUpgradeRole: () => Promise<void>;
  onRequestRoleUpgrade: () => Promise<void>;
  onFetchPendingInvitations: () => Promise<any>;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamManagementWrapper({
  filteredTeams,
  selectedTeamId,
  selectedOrgId,
  selectedOrganization,
  members,
  pendingInvitations,
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
  isChangingOrg,
  onSelectTeam,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations,
  getTeamEquipmentCount
}: TeamManagementWrapperProps) {
  const hasCreatePermission = selectedOrganization?.role === 'owner' || 
                             selectedOrganization?.role === 'manager' ||
                             selectedOrganization?.is_primary;

  const selectedTeam = filteredTeams.find(team => team.id === selectedTeamId);

  if (!selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <TeamSelector
            teams={filteredTeams}
            value={selectedTeamId}
            onChange={onSelectTeam}
            disabled={isChangingOrg}
          />
          
          {hasCreatePermission && (
            <CreateTeamButton
              onCreateTeam={onCreateTeam}
              isCreating={isCreatingTeam}
            />
          )}
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          <p>No team selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <TeamSelector
          teams={filteredTeams}
          value={selectedTeamId}
          onChange={onSelectTeam}
          disabled={isChangingOrg}
        />
        
        {hasCreatePermission && (
          <CreateTeamButton
            onCreateTeam={onCreateTeam}
            isCreating={isCreatingTeam}
          />
        )}
      </div>
      
      <TeamContent
        selectedTeam={selectedTeam}
        members={members}
        pendingInvitations={pendingInvitations}
        teams={filteredTeams}
        isLoading={isLoading}
        currentUserRole={currentUserRole}
        isMember={isMember}
        canChangeRoles={canChangeRoles}
        isUpgradingRole={isUpgradingRole}
        isRequestingRole={isRequestingRole}
        onInviteMember={onInviteMember}
        onChangeRole={onChangeRole}
        onRemoveMember={onRemoveMember}
        onUpdateTeam={onUpdateTeam}
        onDeleteTeam={onDeleteTeam}
        onUpgradeRole={onUpgradeRole}
        onRequestRoleUpgrade={onRequestRoleUpgrade}
        isRepairingTeam={isRepairingTeam}
        onRepairTeam={onRepairTeam}
        onResendInvite={onResendInvite}
        onCancelInvitation={onCancelInvitation}
        getTeamEquipmentCount={getTeamEquipmentCount}
      />
    </div>
  );
}
