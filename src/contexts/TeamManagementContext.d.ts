
import { Organization } from '@/types';
import { Team } from '@/services/team';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

export interface TeamManagementContextType {
  // Team and organization data
  teams: Team[];
  members: TeamMember[];
  pendingInvitations: any[];
  selectedTeamId: string;
  organizations: Organization[];
  selectedOrgId?: string;
  selectedOrganization: Organization | null;
  filteredTeams: Team[];
  
  // State flags
  isLoading: boolean;
  isLoadingInvitations: boolean;
  isCreatingTeam: boolean;
  isUpdatingTeam: boolean;
  isDeletingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  isMember: boolean;
  isChangingOrg: boolean;
  
  // User roles and permissions
  currentUserRole: string | null;
  canChangeRoles: boolean;
  
  // Error handling
  error: string | null;
  
  // Functions - corrected signatures to match actual usage
  setSelectedTeamId: (teamId: string) => void;
  handleOrganizationChange: (orgId: string) => void;
  handleCreateTeam: (name: string) => Promise<any>;
  handleUpdateTeam: (teamId: string, data: { name: string }) => Promise<any>;
  handleDeleteTeam: () => Promise<any>; 
  handleInviteMember: (email: string, role: UserRole) => Promise<any>;
  handleChangeRole: (userId: string, role: UserRole) => Promise<any>;
  handleRemoveMember: (userId: string) => Promise<any>;
  handleResendInvite: (id: string) => Promise<any>;
  handleCancelInvitation: (id: string) => Promise<any>;
  handleUpgradeRole: () => Promise<any>;
  handleRequestRoleUpgrade: () => Promise<any>;
  refetchTeamMembers: () => void;
  refetchPendingInvitations: () => Promise<any>;
  fetchTeams: () => void;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}
