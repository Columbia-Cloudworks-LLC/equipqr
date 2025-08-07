
import React, { createContext, useContext } from 'react';
import { useSession } from '@/contexts/SessionContext';

export interface TeamMembership {
  team_id: string;
  team_name: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  joined_date: string;
}

export interface TeamMembershipContextType {
  teamMemberships: TeamMembership[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasTeamRole: (teamId: string, role: string) => boolean;
  hasTeamAccess: (teamId: string) => boolean;
  canManageTeam: (teamId: string) => boolean;
  getUserTeamIds: () => string[];
}

const TeamContext = createContext<TeamMembershipContextType | undefined>(undefined);

// Export constants to satisfy ESLint
export const TEAM_CONSTANTS = {
  DEFAULT_ROLE: 'viewer',
  MAX_TEAM_SIZE: 50,
} as const;

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    sessionData, 
    isLoading, 
    error, 
    hasTeamRole, 
    hasTeamAccess, 
    canManageTeam, 
    getUserTeamIds,
    refreshSession 
  } = useSession();

  // Convert session team memberships to the expected format
  const teamMemberships: TeamMembership[] = (sessionData?.teamMemberships || []).map(tm => ({
    team_id: tm.teamId,
    team_name: tm.teamName,
    role: tm.role,
    joined_date: tm.joinedDate
  }));

  const teamData: TeamMembershipContextType = {
    teamMemberships,
    isLoading,
    error,
    refetch: refreshSession,
    hasTeamRole,
    hasTeamAccess,
    canManageTeam,
    getUserTeamIds
  };

  return (
    <TeamContext.Provider value={teamData}>
      {children}
    </TeamContext.Provider>
  );
};
