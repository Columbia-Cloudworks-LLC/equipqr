
import { useState } from 'react';

// DEPRECATED: This hook has been replaced by SessionContext for better performance
// Use useSession() from @/contexts/SessionContext instead
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

export const useTeamMembership = (): TeamMembershipContextType => {
  console.warn('useTeamMembership is deprecated. Use SessionContext instead.');
  
  return {
    teamMemberships: [],
    isLoading: false,
    error: 'This hook is deprecated. Use SessionContext instead.',
    refetch: async () => {},
    hasTeamRole: () => false,
    hasTeamAccess: () => false,
    canManageTeam: () => false,
    getUserTeamIds: () => []
  };
};
