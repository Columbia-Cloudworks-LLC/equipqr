
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateTeamMembership, repairTeamMembership, getTeamAccessDetails } from '@/services/team';

export function useTeamMembership(teamId: string | null) {
  const [isMember, setIsMember] = useState<boolean>(true);
  const [isRepairingTeam, setIsRepairingTeam] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const [accessRole, setAccessRole] = useState<string | null>(null);
  const [hasCrossOrgAccess, setHasCrossOrgAccess] = useState<boolean>(false);
  const [teamOrgName, setTeamOrgName] = useState<string | null>(null);
  
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
      // Always set to true initially to avoid flashing "not a member" message
      setIsMember(true);
      setError(null);
      checkDetailedTeamAccess(teamId, currentUserId);
    } else {
      setIsMember(true); // Reset to true when no team is selected
      setAccessReason(null);
      setAccessRole(null);
      setHasCrossOrgAccess(false);
      setTeamOrgName(null);
      setError(null);
    }
  }, [teamId, currentUserId]);

  const checkDetailedTeamAccess = async (teamId: string, userId: string) => {
    try {
      // Clear previous state
      setError(null);
      
      // Use the enhanced team access details function
      // This calls an edge function that bypasses RLS recursion issues
      const accessDetails = await getTeamAccessDetails(userId, teamId);
      
      setIsMember(accessDetails.isMember);
      setAccessReason(accessDetails.accessReason);
      setHasCrossOrgAccess(accessDetails.hasCrossOrgAccess);
      setTeamOrgName(accessDetails.orgName || null);
      
      // Only set access role if it's not null to prevent overriding with null
      if (accessDetails.role !== null) {
        setAccessRole(accessDetails.role);
      }
      
      if (!accessDetails.isMember) {
        setError('You are not a member of this team. This may be due to an issue during team creation.');
      } else {
        setError(null);
      }
      
      // Log detailed access information for debugging
      console.log('Team access details:', {
        teamId,
        isMember: accessDetails.isMember,
        reason: accessDetails.accessReason,
        role: accessDetails.role,
        hasCrossOrgAccess: accessDetails.hasCrossOrgAccess,
        orgName: accessDetails.orgName
      });
    } catch (error: any) {
      console.error('Error checking team access:', error);
      setError('Failed to verify team membership. We will assume you are a member for now.');
      // Even on error, assume membership to avoid blocking user interaction
      setIsMember(true);
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
        await checkDetailedTeamAccess(teamId, currentUserId);
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
    accessReason,
    accessRole,
    hasCrossOrgAccess,
    teamOrgName,
    handleRepairTeam,
    checkTeamMembership: checkDetailedTeamAccess
  };
}
