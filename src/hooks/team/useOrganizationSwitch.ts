
import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useOrganizationSwitch(fetchTeams: () => void, setSelectedTeamId: (id: string) => void) {
  const { organizations, selectedOrganization, selectOrganization } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    selectedOrganization?.id
  );
  const [isChangingOrg, setIsChangingOrg] = useState(false);

  // Update organization context when selectedOrgId changes
  useEffect(() => {
    const updateOrganization = async () => {
      if (selectedOrgId && selectedOrgId !== selectedOrganization?.id) {
        setIsChangingOrg(true);
        
        try {
          // Clear team selection first to avoid validation errors
          setSelectedTeamId('');
          
          // Update the organization context
          await selectOrganization(selectedOrgId);
          
          // Fetch teams for the new organization after a small delay
          // to allow context to update fully
          setTimeout(() => {
            fetchTeams();
            setIsChangingOrg(false);
          }, 300);
        } catch (error) {
          console.error('Error changing organization:', error);
          setIsChangingOrg(false);
        }
      }
    };
    
    updateOrganization();
  }, [selectedOrgId, selectOrganization, fetchTeams, selectedOrganization, setSelectedTeamId]);

  // Update selectedOrgId when selectedOrganization changes (feedback loop protection)
  useEffect(() => {
    if (selectedOrganization && !isChangingOrg && selectedOrgId !== selectedOrganization.id) {
      setSelectedOrgId(selectedOrganization.id);
    }
  }, [selectedOrganization, isChangingOrg, selectedOrgId]);

  const handleOrganizationChange = (orgId: string) => {
    if (orgId === selectedOrgId) return;
    
    // Set changing state and clear team selection
    setIsChangingOrg(true);
    setSelectedTeamId('');
    
    // Update the selected organization ID
    setSelectedOrgId(orgId);
  };

  return {
    selectedOrgId,
    isChangingOrg,
    handleOrganizationChange,
    organizations
  };
}
