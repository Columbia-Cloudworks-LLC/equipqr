
import { useState, useEffect, useCallback } from 'react';
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
  const [retryCount, setRetryCount] = useState(0);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching teams from useTeams hook');
      
      // Use AbortController to handle timeouts
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 second timeout
      
      try {
        const fetchedTeams = await getTeams();
        
        console.log('Fetched teams:', fetchedTeams);
        
        // Setting teams array even if empty
        setTeams(fetchedTeams || []);
        
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('Team fetch request timed out');
          throw new Error('Request timed out. Please try again.');
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error in fetchTeams:', error);
      setError('Failed to load your teams. Please try again.');
      
      // Only show toast for non-authentication errors
      if (!error.message?.includes('must be logged in')) {
        toast.error("Error fetching teams", {
          description: error.message || "Unknown error occurred",
        });
      }
      
      // Set empty array to prevent infinite loading state
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      
      console.log('Deleting team with ID:', teamId);
      const result: DeleteTeamResult = await deleteTeam(teamId);
      
      toast.success("Team deleted successfully", {
        description: result.equipmentUpdated > 0 
          ? `${result.equipmentUpdated} equipment items were unassigned` 
          : "No equipment needed to be reassigned",
      });
      
      // Refresh the teams list after deletion
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
  
  const retryFetchTeams = useCallback(() => {
    console.log('Manually retrying teams fetch');
    setRetryCount(prev => prev + 1);
    toast.info("Retrying team fetch...");
  }, []);

  useEffect(() => {
    console.log('useTeams hook initialized, fetching teams');
    fetchTeams();
  }, [fetchTeams, retryCount]);

  // Add retry logic for empty teams
  useEffect(() => {
    if (teams.length === 0 && !isLoading && !error && retryCount === 0) {
      // Try once more after a delay
      const timer = setTimeout(() => {
        console.log('No teams found on initial fetch, retrying once');
        retryFetchTeams();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [teams.length, isLoading, error, retryCount, retryFetchTeams]);

  return {
    teams,
    isLoading,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    error,
    fetchTeams,
    retryFetchTeams,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  };
}
