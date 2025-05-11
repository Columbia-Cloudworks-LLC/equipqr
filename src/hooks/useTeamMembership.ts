
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateTeamMembership, repairTeamMembership } from '@/services/team';

export function useTeamMembership(teamId: string | null) {
  const [isMember, setIsMember] = useState<boolean>(true);
  const [isRepairingTeam, setIsRepairingTeam] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the current user's ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Check team membership when teamId or currentUserId changes
  useEffect(() => {
    if (teamId && teamId !== 'none' && currentUserId) {
      checkTeamMembership(teamId, currentUserId);
    } else {
      setIsMember(true); // Reset to true when no team is selected
    }
  }, [teamId, currentUserId]);

  const checkTeamMembership = async (teamId: string, userId: string) => {
    try {
      const isMember = await validateTeamMembership(userId, teamId);
      setIsMember(isMember);
      
      if (!isMember) {
        setError('You are not a member of this team. This may be due to an issue during team creation.');
      } else {
        setError(null);
      }
    } catch (error: any) {
      console.error('Error checking team membership:', error);
      setError('Failed to verify team membership.');
    }
  };

  const handleRepairTeam = async (teamId: string) => {
    if (!teamId) return;
    
    try {
      setIsRepairingTeam(true);
      setError(null);
      await repairTeamMembership(teamId);
      toast.success("Team membership repaired", {
        description: "You have been added as a team manager",
      });
      
      // Re-check team membership
      if (currentUserId) {
        await checkTeamMembership(teamId, currentUserId);
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
  };

  return {
    isMember,
    isRepairingTeam,
    currentUserId,
    error,
    handleRepairTeam,
    checkTeamMembership
  };
}
