import { UserRole } from '@/types/supabase-enums';
import { TeamSelectorWithCreate } from '@/components/Team/TeamSelectorWithCreate';
import { TeamContent } from '@/components/Team/TeamContent';
import { Organization } from '@/types';
import { Team } from '@/services/team';

interface TeamManagementWrapperProps {
  filteredTeams: Team[];
  selectedTeamId: string;
  selectedOrgId?: string;
  selectedOrganization: Organization | null;
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
  onUpdateTeam: (id: string, name: string) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>; // Explicitly use Promise<any>
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
  // Determine if the user can manage teams in the selected organization
  const canManageTeamsInOrg = selectedOrganization?.role === 'owner' || 
                             selectedOrganization?.role === 'manager' || 
                             selectedOrganization?.role === 'admin';

  if (filteredTeams.length === 0) {
    return (
      <div className="mt-6 text-center p-6 border border-dashed rounded-lg">
        <p>No teams available in this organization</p>
      </div>
    );
  }

  return (
    <>
      <TeamSelectorWithCreate 
        teams={filteredTeams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={onSelectTeam}
        onCreateTeam={onCreateTeam}
        isCreatingTeam={isCreatingTeam}
        isChangingOrg={isChangingOrg}
        showCreateButton={canManageTeamsInOrg}
      />
      
      {selectedTeamId ? (
        <TeamContent
          selectedTeamId={selectedTeamId}
          members={members}
          pendingInvitations={pendingInvitations}
          teams={filteredTeams}
          isLoading={isLoading}
          isLoadingInvitations={isLoadingInvitations}
          isCreatingTeam={isCreatingTeam}
          isUpdatingTeam={isUpdatingTeam}
          isDeletingTeam={isDeletingTeam}
          isRepairingTeam={isRepairingTeam}
          isUpgradingRole={isUpgradingRole}
          isRequestingRole={isRequestingRole}
          isMember={isMember}
          currentUserRole={currentUserRole}
          canChangeRoles={canChangeRoles}
          onInviteMember={onInviteMember}
          onChangeRole={onChangeRole}
          onRemoveMember={onRemoveMember}
          onResendInvite={onResendInvite}
          onCancelInvitation={onCancelInvitation}
          onCreateTeam={onCreateTeam}
          onUpdateTeam={onUpdateTeam}
          onDeleteTeam={onDeleteTeam}
          onRepairTeam={onRepairTeam}
          onUpgradeRole={onUpgradeRole}
          onRequestRoleUpgrade={onRequestRoleUpgrade}
          onFetchPendingInvitations={onFetchPendingInvitations}
          getTeamEquipmentCount={getTeamEquipmentCount}
        />
      ) : (
        <div className="mt-6 text-center p-6 border border-dashed rounded-lg">
          <p>Select a team from the dropdown above</p>
        </div>
      )}
    </>
  );
}
