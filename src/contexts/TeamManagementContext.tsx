
import React, { createContext, useContext } from 'react';
import { Organization } from '@/types';
import { Team } from '@/services/team';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { TeamManagementContextType } from './TeamManagementContext.d';

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

// Export the type to make it accessible from other files
export type { TeamManagementContextType };
