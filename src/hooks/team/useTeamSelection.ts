
import { useState, useCallback } from 'react';
import { Team } from '@/services/team';

export function useTeamSelection(teams: Team[]) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  // Handle deletion of a team and update the selected team if needed
  const handleDeleteAndUpdateSelection = useCallback(
    async (
      deleteFunction: (id: string) => Promise<any>, 
      teamId: string
    ): Promise<any> => {
      try {
        // Call the delete function and wait for the result
        const result = await deleteFunction(teamId);
        
        // If the deleted team was selected, select a new team
        if (teamId === selectedTeamId && teams.length > 1) {
          const remainingTeams = teams.filter(team => team.id !== teamId);
          if (remainingTeams.length > 0) {
            setSelectedTeamId(remainingTeams[0].id);
          } else {
            setSelectedTeamId('');
          }
        }
        
        return result;
      } catch (error) {
        console.error('Error in handleDeleteAndUpdateSelection:', error);
        throw error;
      }
    },
    [selectedTeamId, teams, setSelectedTeamId]
  );

  return {
    selectedTeamId,
    setSelectedTeamId,
    handleDeleteAndUpdateSelection
  };
}
