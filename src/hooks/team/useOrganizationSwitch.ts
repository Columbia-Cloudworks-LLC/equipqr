
import { useState, useEffect, useCallback } from 'react';
import { Organization } from '@/types';
import { UserOrganization } from '@/services/organization/userOrganizations';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useOrganizationSwitch(
  onOrgChange: () => void,
  onResetTeamSelection: (value: string) => void
) {
  const { organizations, selectedOrganization: contextSelectedOrg } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isChangingOrg, setIsChangingOrg] = useState<boolean>(false);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  
  // Initialize selected org ID from context
  useEffect(() => {
    if (contextSelectedOrg && contextSelectedOrg.id) {
      setSelectedOrgId(contextSelectedOrg.id);
      setSelectedOrganization(contextSelectedOrg);
    } else if (organizations.length > 0) {
      // Find primary org or use the first one
      const primaryOrg = organizations.find(org => org.is_primary) || organizations[0];
      setSelectedOrgId(primaryOrg.id);
      setSelectedOrganization(primaryOrg);
    }
  }, [contextSelectedOrg, organizations]);
  
  // When org ID changes, update the selected organization object
  useEffect(() => {
    if (selectedOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === selectedOrgId);
      if (org) {
        setSelectedOrganization(org);
      }
    }
  }, [selectedOrgId, organizations]);
  
  // Handle organization change
  const handleOrganizationChange = useCallback(async (orgId: string) => {
    if (orgId === selectedOrgId) {
      return; // No change needed
    }
    
    setIsChangingOrg(true);
    
    try {
      // Clear team selection to prevent incorrect data display
      onResetTeamSelection('');
      
      // Update selected org ID
      setSelectedOrgId(orgId);
      
      // Get fresh teams data for the new organization
      await onOrgChange();
      
    } finally {
      // Ensure loading state is cleared even if there's an error
      setIsChangingOrg(false);
    }
  }, [selectedOrgId, onOrgChange, onResetTeamSelection]);
  
  return {
    selectedOrgId,
    isChangingOrg,
    handleOrganizationChange,
    organizations: organizations as UserOrganization[],
    selectedOrganization
  };
}
