
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateTeamMembership, repairTeamMembership, getTeamAccessDetails } from '@/services/team/validation';

export interface TeamAccessDetails {
  hasAccess: boolean;
  role: string | null;
  // Additional fields to avoid type errors
  isMember: boolean;
  hasOrgAccess: boolean;
  orgRole: string | null;
  accessReason: string | null;
  hasCrossOrgAccess: boolean;
  orgName: string | null;
  team: any;
  error?: string | null;
}

export function useTeamMembership(teamId: string | null) {
  const [isMember, setIsMember] = useState<boolean>(true); // Optimistic initial state
  const [isRepairingTeam, setIsRepairingTeam] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const [accessRole, setAccessRole] = useState<string | null>(null);
  const [hasCrossOrgAccess, setHasCrossOrgAccess] = useState<boolean>(false);
  const [teamOrgName, setTeamOrgName] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [hasOrgAccess, setHasOrgAccess] = useState<boolean>(false);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  
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
          setCurrentUserId(data.session.user.id);
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

  // Check team membership when teamId or currentUserId changes
  useEffect(() => {
    if (teamId && teamId !== 'none' && currentUserId) {
      // Always set to true initially to avoid flashing "not a member" message
      setIsMember(true);
      setError(null);
      checkDetailedTeamAccess(teamId);
    } else {
      setIsMember(true); // Reset to true when no team is selected
      setAccessReason(null);
      setAccessRole(null);
      setHasCrossOrgAccess(false);
      setTeamOrgName(null);
      setTeamDetails(null);
      setError(null);
      setHasOrgAccess(false);
      setOrganizationRole(null);
    }
  }, [teamId, currentUserId, retryCount]);

  const checkDetailedTeamAccess = async (teamId: string) => {
    if (isCheckingAccess) return; // Prevent concurrent checks
    
    try {
      setIsCheckingAccess(true);
      // Clear previous state
      setError(null);
      
      console.log(`Checking detailed team access for team ${teamId}`);
      
      // Use the enhanced team access details function with improved logic for org roles
      const accessDetails = await getTeamAccessDetails(teamId);
      
      console.log('Team access details result:', accessDetails);
      
      // Use the hasAccess flag directly - it now considers both direct membership and org role access
      const hasAccess = accessDetails.hasAccess;
      
      // Track if user has org-level access and their org role
      setHasOrgAccess(accessDetails.hasOrgAccess || false);
      setOrganizationRole(accessDetails.orgRole || null);
      
      // Set member status based on direct membership or org access
      setIsMember(hasAccess);
      
      // Only set access role if it's not null to prevent overriding with null
      if (accessDetails.role !== null) {
        setAccessRole(accessDetails.role);
      }
      
      // Set additional context for debugging
      setAccessReason(accessDetails.accessReason);
      setHasCrossOrgAccess(accessDetails.hasCrossOrgAccess);
      setTeamOrgName(accessDetails.orgName);
      setTeamDetails(accessDetails.team);
      
      // Only show errors if there's no access
      if (!hasAccess) {
        setError('You are not a member of this team and have no organization-level access. This may be due to an issue during team creation.');
      } else {
        setError(null);
      }
      
    } catch (error: any) {
      console.error('Error checking team access:', error);
      setError('Failed to verify team membership. Please try again.');
      // On error, assume no membership to show the repair option
      setIsMember(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleRepairTeam = async (teamId: string) => {
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
  };

  const retryAccessCheck = useCallback(() => {
    if (teamId && currentUserId) {
      console.log("Manually retrying team access check");
      setRetryCount(count => count + 1);
      toast.info("Retrying team access check...");
    }
  }, [teamId, currentUserId]);

  return {
    isMember,
    isRepairingTeam,
    isCheckingAccess,
    currentUserId,
    error,
    accessReason,
    accessRole,
    hasCrossOrgAccess,
    hasOrgAccess,
    organizationRole,
    teamOrgName,
    teamDetails,
    handleRepairTeam,
    checkTeamMembership: checkDetailedTeamAccess,
    retryAccessCheck
  };
}
