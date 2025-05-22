
import React, { createContext, useContext } from 'react';
import { Organization } from '@/types';
import { Team } from '@/services/team';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

interface TeamManagementContextType {
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
  isRepairingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  isMember: boolean;
  isChangingOrg: boolean;
  
  // User roles and permissions
  currentUserRole: string | null;
  canChangeRoles: boolean;
  
  // Error handling
  error: string | null;
  
  // Functions
  setSelectedTeamId: (teamId: string) => void;
  handleOrganizationChange: (orgId: string) => void;
  handleCreateTeam: (name: string) => Promise<any>;
  handleUpdateTeam: (id: string, name: string) => Promise<any>;
  handleDeleteTeam: (teamId: string) => Promise<any>;
  handleInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>;
  handleChangeRole: (userId: string, role: UserRole) => Promise<any>;
  handleRemoveMember: (userId: string) => Promise<any>;
  handleResendInvite: (id: string) => Promise<void>;
  handleCancelInvitation: (id: string) => Promise<void>;
  handleRepairTeam: (teamId: string) => Promise<void>;
  handleUpgradeRole: (teamId: string) => Promise<void>;
  handleRequestRoleUpgrade: (teamId: string) => Promise<void>;
  refetchTeamMembers: () => void;
  refetchPendingInvitations: () => Promise<void>;
  fetchTeams: () => void;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

const TeamManagementContext = createContext<TeamManagementContextType | undefined>(undefined);

export const useTeamManagementContext = () => {
  const context = useContext(TeamManagementContext);
  if (!context) {
    throw new Error('useTeamManagementContext must be used within a TeamManagementProvider');
  }
  return context;
};

interface TeamManagementProviderProps {
  children: React.ReactNode;
  value: TeamManagementContextType;
}

export const TeamManagementProvider: React.FC<TeamManagementProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <TeamManagementContext.Provider value={value}>
      {children}
    </TeamManagementContext.Provider>
  );
};
