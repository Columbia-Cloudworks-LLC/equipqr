
import React, { createContext, useContext } from 'react';
import { useTeamMembership, TeamMembershipContextType } from '@/hooks/useTeamMembership';

const TeamContext = createContext<TeamMembershipContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const teamData = useTeamMembership();

  return (
    <TeamContext.Provider value={teamData}>
      {children}
    </TeamContext.Provider>
  );
};
