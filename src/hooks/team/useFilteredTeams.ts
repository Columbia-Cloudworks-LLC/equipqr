
import { useMemo } from 'react';
import { Team } from '@/services/team';
import { Organization } from '@/types';

export function useFilteredTeams(
  teams: Team[], 
  selectedOrganization?: Organization | null
) {
  // Filter teams by selected organization
  return useMemo(() => {
    // Filter by org ID and also ensure we only include non-deleted teams
    return selectedOrganization?.id 
      ? teams.filter(team => team.org_id === selectedOrganization.id && !team.deleted_at) 
      : teams.filter(team => !team.deleted_at);
  }, [teams, selectedOrganization?.id]);
}
