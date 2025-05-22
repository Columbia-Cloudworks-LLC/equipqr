
import { useCallback } from 'react';
import { toast } from 'sonner';
import { repairTeamMembership } from '@/services/team/validation';

/**
 * Hook to handle team membership repair
 */
export function useTeamMembershipRepair(
  currentUserId: string | null,
  setIsRepairingTeam: (value: boolean) => void,
  setError: (error: string | null) => void,
  setRetryCount: (value: number | ((prev: number) => number)) => void
) {
  const handleRepairTeam = useCallback(async (teamId: string) => {
    if (!teamId) return;
    
    try {
      setIsRepairingTeam(true);
      setError(null);
      
      console.log(`Attempting to repair team membership for team ${teamId}`);
      
      // Call the repair function
      const result = await repairTeamMembership(teamId);
      
      if (result && result.success) {
        toast.success("Team membership repaired", {
          description: "You have been added as a team manager",
        });
        
        // Re-check team membership after a short delay to allow DB to update
        setTimeout(() => {
          if (currentUserId) {
            console.log("Re-checking team membership after repair");
            setRetryCount(count => count + 1); // This will trigger re-check through useEffect
          }
        }, 1000);
      } else {
        throw new Error(result?.error || "Repair failed with unknown error");
      }
    } catch (error: any) {
      console.error('Error in handleRepairTeam:', error);
      setError(`Failed to repair team: ${error.message}`);
      toast.error("Error repairing team", {
        description: error.message,
      });
    } finally {
      setIsRepairingTeam(false);
    }
  }, [currentUserId, setIsRepairingTeam, setError, setRetryCount]);

  return { handleRepairTeam };
}
