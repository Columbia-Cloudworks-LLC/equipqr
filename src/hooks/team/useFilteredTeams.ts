
import { useMemo } from 'react';
import { Team } from '@/services/team';
import { UserOrganization } from '@/services/organization/userOrganizations';

export function useFilteredTeams(
  teams: Team[], 
  selectedOrganization?: UserOrganization | null
) {
  // Filter teams by selected organization
  return useMemo(() => {
    // Filter by org ID and also ensure we only include non-deleted teams
    return selectedOrganization?.id 
      ? teams.filter(team => team.org_id === selectedOrganization.id && !team.deleted_at) 
      : teams.filter(team => !team.deleted_at);
  }, [teams, selectedOrganization?.id]);
}
