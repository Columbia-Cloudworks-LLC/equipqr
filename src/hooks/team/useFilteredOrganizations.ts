
import { useMemo } from 'react';
import { Team } from '@/services/team';
import { Organization } from '@/types';

export function useFilteredOrganizations(
  organizations: Organization[], 
  teams: Team[], 
  selectedOrganization?: Organization | null
) {
  // Filter organizations for the selector - viewers shouldn't see orgs with no teams
  return useMemo(() => {
    if (!organizations || organizations.length <= 1) return organizations;
    
    // If user is not a manager/owner/admin, only show orgs where they have teams
    if (selectedOrganization?.role === 'viewer') {
      return organizations.filter(org => {
        // Always include their primary org
        if (org.is_primary) return true;
        
        // For non-primary orgs, only include if they have at least one team there
        return teams.some(team => team.org_id === org.id && !team.deleted_at);
      });
    }
    
    return organizations;
  }, [organizations, teams, selectedOrganization]);
}
