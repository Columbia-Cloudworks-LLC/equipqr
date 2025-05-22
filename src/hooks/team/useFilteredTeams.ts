
import { useMemo, useEffect } from 'react';
import { Team } from '@/services/team';

export function useFilteredTeams(
  teams: Team[], 
  selectedOrgId?: string, 
  isChangingOrg: boolean = false
) {
  // Filter teams by selected organization
  return useMemo(() => {
    // Filter by org ID and also ensure we only include non-deleted teams
    return selectedOrgId 
      ? teams.filter(team => team.org_id === selectedOrgId && !team.deleted_at) 
      : teams.filter(team => !team.deleted_at);
  }, [teams, selectedOrgId]);
}
