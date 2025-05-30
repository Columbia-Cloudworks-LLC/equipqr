
import { Organization } from '@/types';
import { Team } from '@/services/team';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationMember {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

export interface TeamManagementContextType {
  // Data
  teams: Team[];
  members: TeamMember[];
  pendingInvitations: any[];
  organizationMembers: OrganizationMember[];
  existingTeamMemberIds: string[];
  selectedTeamId: string;
  selectedOrganization: Organization | null;
  filteredTeams: Team[];
  
  // Loading states
  isLoading: boolean;
  isLoadingInvitations: boolean;
  isCreatingTeam: boolean;
  isUpdatingTeam: boolean;
  isDeletingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  
  // User state
  isMember: boolean;
  currentUserRole?: string;
  canChangeRoles: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setSelectedTeamId: (teamId: string) => void;
  handleCreateTeam: (name: string) => Promise<void>;
  handleUpdateTeam: (teamId: string, data: { name: string }) => Promise<void>;
  handleDeleteTeam: () => Promise<void>;
  handleAddOrgMember: (userId: string, role: string) => Promise<void>;
  handleInviteMember: (email: string, role: UserRole) => Promise<void>;
  handleChangeRole: (userId: string, role: UserRole) => Promise<void>;
  handleRemoveMember: (userId: string) => Promise<void>;
  handleResendInvite: (id: string) => Promise<void>;
  handleCancelInvitation: (id: string) => Promise<void>;
  handleUpgradeRole: () => Promise<void>;
  handleRequestRoleUpgrade: () => Promise<void>;
  refetchTeamMembers: () => void;
  refetchPendingInvitations: () => Promise<void>;
  fetchTeams: () => void;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
  refetchOrgMembers: () => void;
}
