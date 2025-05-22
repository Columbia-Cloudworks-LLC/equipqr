
import { useState, useEffect } from 'react';
import { Team } from '@/types';

export function useTeamSelection(teams: Team[], isChangingOrg: boolean = false) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Select first team if available and none is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      console.log('Setting selected team to:', teams[0].id);
      setSelectedTeamId(teams[0].id);
    } else if (teams.length > 0 && selectedTeamId && !teams.find(team => team.id === selectedTeamId)) {
      // If currently selected team no longer exists (e.g., after deletion),
      // select the first available team instead
      console.log('Previously selected team not found, selecting first available team');
      setSelectedTeamId(teams[0].id);
    } else if (teams.length === 0) {
      // Clear selection if there are no teams
      setSelectedTeamId('');
    }
  }, [teams, selectedTeamId]);

  // Enhanced delete team handler that updates selection if needed
  const handleDeleteAndUpdateSelection = async (handleDeleteTeam: (teamId: string) => Promise<any>, teamId: string) => {
    try {
      // Try to delete the team
      await handleDeleteTeam(teamId);
      
      // Selection will be handled by the useEffect above
    } catch (error) {
      // Let the error propagate up for UI handling
      throw error;
    }
  };

  return {
    selectedTeamId,
    setSelectedTeamId,
    handleDeleteAndUpdateSelection
  };
}
