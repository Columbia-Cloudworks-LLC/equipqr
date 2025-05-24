
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
  onUpdateTeam: (id: string, name: string) => Promise<any>;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <TeamSelector
          teams={filteredTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={onSelectTeam}
          isChangingOrg={isChangingOrg}
        />
        
        {hasCreatePermission && (
          <CreateTeamButton
            onCreateTeam={onCreateTeam}
            isCreatingTeam={isCreatingTeam}
          />
        )}
      </div>
      
      {selectedTeamId && (
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
      )}
    </div>
  );
}
