
import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Organization } from '@/types';
import { UserOrganization } from '@/services/organization/userOrganizations';

/**
 * Hook to manage organization switching in team management
 */
export function useOrganizationSwitch(
  fetchTeams: () => Promise<void>, 
  setSelectedTeamId: (id: string) => void
) {
  const { organizations, selectedOrganization: contextSelectedOrg } = useOrganization();
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    contextSelectedOrg?.id
  );
  
  const [isChangingOrg, setIsChangingOrg] = useState(false);

  // Set initial selected org from context when organizations load
  useEffect(() => {
    if (!selectedOrgId && contextSelectedOrg?.id) {
      setSelectedOrgId(contextSelectedOrg.id);
    }
  }, [selectedOrgId, contextSelectedOrg]);

  // Get the selected organization object
  const selectedOrganization = organizations.find(org => org.id === selectedOrgId);

  // Handle organization change
  const handleOrganizationChange = useCallback(async (orgId: string) => {
    if (orgId === selectedOrgId) return;
    
    setIsChangingOrg(true);
    setSelectedTeamId('');  // Clear selected team
    setSelectedOrgId(orgId);
    
    try {
      await fetchTeams();
    } finally {
      setIsChangingOrg(false);
    }
  }, [selectedOrgId, setSelectedTeamId, fetchTeams]);
  
  return {
    selectedOrgId,
    isChangingOrg,
    handleOrganizationChange,
    organizations,
    selectedOrganization
  };
}
