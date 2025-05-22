
import { supabase } from '@/integrations/supabase/client';
import { TeamAccessDetails } from '@/hooks/useTeamMembership';

/**
 * Checks if the current user has access to a team
 * @param teamId - The ID of the team to check
 */
export async function validateTeamMembership(teamId: string): Promise<boolean> {
  try {
    if (!teamId) {
      return false;
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return false;
    }
    
    // Use improved edge function to check access
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId 
      }
    });
    
    if (error) {
      console.error('Error validating team membership:', error);
      
      // Fallback to simple team membership check
      const { data: membershipData, error: membershipError } = await supabase
        .from('team_member')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (membershipError) {
        console.error('Error in fallback membership check:', membershipError);
        return false;
      }
      
      return !!membershipData;
    }
    
    // If the edge function worked, check has_access which includes both direct membership and org-level access
    return data?.has_access === true;
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    return false;
  }
}

/**
 * Get detailed team access information
 */
export async function getTeamAccessDetails(teamId: string): Promise<TeamAccessDetails> {
  try {
    if (!teamId) {
      return {
        hasAccess: false,
        role: null,
        isMember: false,
        hasOrgAccess: false,
        orgRole: null,
        accessReason: null,
        hasCrossOrgAccess: false,
        orgName: null,
        team: null,
        error: 'No team ID provided'
      };
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return {
        hasAccess: false,
        role: null,
        isMember: false,
        hasOrgAccess: false,
        orgRole: null,
        accessReason: null,
        hasCrossOrgAccess: false,
        orgName: null,
        team: null,
        error: 'Not authenticated'
      };
    }
    
    // Use the improved edge function with retry logic
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId 
      }
    });
    
    if (error) {
      console.error('Error checking team access:', error);
      return {
        hasAccess: false,
        role: null,
        isMember: false,
        hasOrgAccess: false,
        orgRole: null,
        accessReason: null,
        hasCrossOrgAccess: false,
        orgName: null,
        team: null,
        error: error.message
      };
    }
    
    // Check if data is returned and has the expected properties
    if (!data) {
      return {
        hasAccess: false,
        role: null,
        isMember: false,
        hasOrgAccess: false,
        orgRole: null,
        accessReason: null,
        hasCrossOrgAccess: false,
        orgName: null,
        team: null,
        error: 'No data returned from access check'
      };
    }
    
    console.log('Team access details from edge function:', data);
    
    // Return the extended properties, with more reliable hasAccess flag
    return {
      hasAccess: data.has_access || false,
      role: data.role || null,
      isMember: data.is_member || false,
      hasOrgAccess: data.has_org_access || false,
      orgRole: data.org_role || null,
      accessReason: data.access_reason || null,
      hasCrossOrgAccess: data.has_cross_org_access || false,
      orgName: data.org_name || null,
      team: data.team_details || null,
      error: null
    };
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    return {
      hasAccess: false,
      role: null,
      isMember: false,
      hasOrgAccess: false,
      orgRole: null,
      accessReason: null,
      hasCrossOrgAccess: false,
      orgName: null,
      team: null,
      error: error.message || 'Failed to check team access'
    };
  }
}

/**
 * Repair team membership by adding the current user as a manager
 */
export async function repairTeamMembership(teamId: string): Promise<{ success: boolean, error?: string }> {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    // Call an edge function to handle the repair
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { team_id: teamId }
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to repair team membership');
    }
    
    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to repair team membership');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error repairing team membership:', error);
    return { success: false, error: error.message };
  }
}
