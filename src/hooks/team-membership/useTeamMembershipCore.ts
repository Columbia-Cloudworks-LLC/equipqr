
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembershipState } from './useTeamMembershipState';
import { useTeamMembershipCheck } from './useTeamMembershipCheck';
import { toast } from '@/hooks/use-toast';

/**
 * Core team membership hook that combines the functionality from the specialized hooks
 */
export function useTeamMembershipCore(teamId: string | null) {
  // Get state management from specialized hook
  const state = useTeamMembershipState();
  
  // Get team membership checking functionality
  const { checkDetailedTeamAccess } = useTeamMembershipCheck(
    teamId,
    state.currentUserId,
    state.retryCount,
    state.setIsCheckingAccess,
    state.setError,
    state.setIsMember,
    state.setAccessRole,
    state.setAccessReason,
    state.setHasCrossOrgAccess,
    state.setTeamOrgName,
    state.setTeamDetails,
    state.setHasOrgAccess,
    state.setOrganizationRole,
    state.setCheckAttempts,
    state.setRetryTimeout
  );
  
  // Get the current user's ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          return;
        }
        
        if (data.session?.user) {
          state.setCurrentUserId(data.session.user.id);
        } else {
          console.warn("No authenticated user found");
          // Redirect to login if needed
        }
      } catch (err) {
        console.error("Error getting auth session:", err);
      }
    };
    
    getCurrentUser();
  }, []);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (state.retryTimeout !== null) {
        clearTimeout(state.retryTimeout);
      }
    };
  }, [state.retryTimeout]);

  // Check team membership when teamId or currentUserId changes
  useEffect(() => {
    if (teamId && teamId !== 'none' && state.currentUserId) {
      // Always set to true initially to avoid flashing "not a member" message
      state.setIsMember(true);
      state.setError(null);
      state.setCheckAttempts(0);
      checkDetailedTeamAccess(teamId);
    } else {
      state.setIsMember(true); // Reset to true when no team is selected
      state.setAccessReason(null);
      state.setAccessRole(null);
      state.setHasCrossOrgAccess(false);
      state.setTeamOrgName(null);
      state.setTeamDetails(null);
      state.setError(null);
      state.setHasOrgAccess(false);
      state.setOrganizationRole(null);
      state.setCheckAttempts(0);
      
      // Clear any pending retries
      if (state.retryTimeout !== null) {
        clearTimeout(state.retryTimeout);
        state.setRetryTimeout(null);
      }
    }
  }, [teamId, state.currentUserId, state.retryCount]);

  const retryAccessCheck = useCallback(() => {
    if (teamId && state.currentUserId) {
      console.log("Manually retrying team access check");
      state.setRetryCount(count => count + 1);
      toast.info("Retrying team access check...");
    }
  }, [teamId, state.currentUserId]);

  // Return combined state and functions from all specialized hooks
  return {
    ...state,
    checkTeamMembership: checkDetailedTeamAccess,
    retryAccessCheck
  };
}
