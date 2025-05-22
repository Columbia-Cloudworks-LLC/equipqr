
import { useState, useEffect, useCallback } from 'react';
import { Organization } from '@/types';
import { UserOrganization } from '@/services/organization/userOrganizations';

export function useTeamManagementOrgs(
  organizations: UserOrganization[],
  fetchTeams: () => void,
  setSelectedTeamId: (id: string) => void
) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>();
  const [isChangingOrg, setIsChangingOrg] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // When organizations change, ensure we have a selected org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      // Find primary org or use the first one
      const primaryOrg = organizations.find(org => org.is_primary);
      setSelectedOrgId(primaryOrg?.id || organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Update selected organization object when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && organizations.length > 0) {
      const org = organizations.find(org => org.id === selectedOrgId);
      if (org) {
        setSelectedOrganization({
          id: org.id,
          name: org.name,
          role: org.role || 'viewer',
          is_primary: !!org.is_primary,
          created_at: org.created_at,
          updated_at: org.updated_at,
          owner_user_id: org.owner_user_id,
          user_id: (org as any).user_id
        });
      }
    }
  }, [selectedOrgId, organizations]);

  // Handle organization change
  const handleOrganizationChange = useCallback((orgId: string) => {
    if (orgId === selectedOrgId) return;
    
    setIsChangingOrg(true);
    setSelectedTeamId(''); // Clear team selection when org changes
    setSelectedOrgId(orgId);
    
    // Fetch teams for the new org
    setTimeout(() => {
      fetchTeams();
      setIsChangingOrg(false);
    }, 300);
  }, [selectedOrgId, fetchTeams, setSelectedTeamId]);

  return {
    selectedOrgId,
    isChangingOrg,
    handleOrganizationChange,
    selectedOrganization
  };
}
