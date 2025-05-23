
import { useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useTeamCreation(
  handleCreateTeamBase: (name: string, orgId?: string) => Promise<any>,
  setSelectedTeamId?: (teamId: string) => void
) {
  const { selectedOrganization } = useOrganization();

  // Enhanced create team handler that sets the selection afterwards
  const handleCreateTeam = useCallback(async (name: string, orgId?: string) => {
    try {
      // Use selected organization from context if not specified
      const targetOrgId = orgId || selectedOrganization?.id;
      
      if (!targetOrgId) {
        throw new Error('No organization selected for team creation');
      }
      
      const result = await handleCreateTeamBase(name, targetOrgId);
      
      // If team creation was successful and we have a team ID, select it
      if (result && (result.id || result.team?.id) && setSelectedTeamId) {
        const newTeamId = result.id || result.team?.id;
        console.log(`useTeamCreation: Auto-selecting newly created team: ${newTeamId}`);
        setSelectedTeamId(newTeamId);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating team:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [handleCreateTeamBase, selectedOrganization, setSelectedTeamId]);

  return {
    handleCreateTeam
  };
}
