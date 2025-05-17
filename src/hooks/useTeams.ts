import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getTeams, createTeam, updateTeam, deleteTeam } from '@/services/team';
import { DeleteTeamResult, getTeamEquipmentCount } from '@/services/team/deleteTeam';

interface Team {
  id: string;
  name: string;
  org_id?: string;
  org_name?: string;
  is_external_org?: boolean;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching teams from useTeams hook');
      const fetchedTeams = await getTeams();
      
      console.log('Fetched teams:', fetchedTeams);
      
      if (!fetchedTeams || fetchedTeams.length === 0) {
        console.log('No teams found');
        setTeams([]);
        return;
      }
      
      setTeams(fetchedTeams);
      
    } catch (error: any) {
      console.error('Error in fetchTeams:', error);
      setError('Failed to load your teams. Please try again.');
      toast.error("Error fetching teams", {
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (name: string) => {
    try {
      setIsCreatingTeam(true);
      setError(null);
      const team = await createTeam(name);
      toast.success("Team created successfully", {
        description: `Team "${name}" has been created`,
      });
      await fetchTeams();
      
      return team;
    } catch (error: any) {
      console.error('Error in handleCreateTeam:', error);
      setError('Failed to create team. Please try again.');
      toast.error("Error creating team", {
        description: error.message,
      });
      return null;
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleUpdateTeam = async (teamId: string, name: string) => {
    try {
      setIsUpdatingTeam(true);
      setError(null);
      await updateTeam(teamId, name);
      toast.success("Team updated successfully", {
        description: `Team name updated to "${name}"`,
      });
      await fetchTeams();
    } catch (error: any) {
      console.error('Error in handleUpdateTeam:', error);
      setError('Failed to update team. Please try again.');
      toast.error("Error updating team", {
        description: error.message,
      });
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      setIsDeletingTeam(true);
      setError(null);
      const result: DeleteTeamResult = await deleteTeam(teamId);
      
      toast.success("Team deleted successfully", {
        description: result.equipmentUpdated > 0 
          ? `${result.equipmentUpdated} equipment items were unassigned` 
          : "No equipment needed to be reassigned",
      });
      
      await fetchTeams();
    } catch (error: any) {
      console.error('Error in handleDeleteTeam:', error);
      setError('Failed to delete team. Please try again.');
      toast.error("Error deleting team", {
        description: error.message,
      });
    } finally {
      setIsDeletingTeam(false);
    }
  };

  useEffect(() => {
    console.log('useTeams hook initialized, fetching teams');
    fetchTeams();
  }, []);

  return {
    teams,
    isLoading,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    error,
    fetchTeams,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  };
}
