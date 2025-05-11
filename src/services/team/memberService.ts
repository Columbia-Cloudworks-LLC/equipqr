
import { supabase } from "@/integrations/supabase/client";
import { TeamMember, ApiTeamMember, mapApiTeamMemberToTeamMember } from "@/types";
import { getAppUserId } from "@/utils/authUtils";
import { validateTeamMembership } from "./teamValidationService";

export async function getTeamMembers(teamId: string) {
  try {
    console.log(`Fetching team members for team: ${teamId}`);
    
    if (!teamId) {
      console.warn('No teamId provided to getTeamMembers');
      return [];
    }
    
    // Validate UUID format before sending to the API
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teamId)) {
      console.error(`Invalid UUID format for teamId: ${teamId}`);
      throw new Error("Invalid team ID format. Please select a valid team.");
    }
    
    // Check if the current user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.error('User is not authenticated');
      throw new Error('Authentication required. Please sign in to view team members.');
    }
    
    // Get team members using our edge function - pass the teamId directly
    const { data, error } = await supabase.functions.invoke<ApiTeamMember[]>('get_team_members', { 
      body: { team_id: teamId }
    });
    
    if (error) {
      console.error('Error fetching team members:', error);
      
      // Provide more specific error messages based on the error
      if (error.message?.includes('Invalid UUID') || error.message?.includes('invalid format')) {
        throw new Error(`Team ID format is invalid. Please try selecting a different team.`);
      } else if (error.message?.includes('Authentication')) {
        throw new Error(`Authentication error: ${error.message}. Please sign in again.`);
      } else {
        throw new Error(`Failed to fetch team members: ${error.message || 'Unknown error'}`);
      }
    }
    
    if (!data) {
      console.warn('No team members found or data is null');
      return [];
    }
    
    // Map the API response to our TeamMember type
    return data.map(member => mapApiTeamMemberToTeamMember(member));
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw new Error(`Team members fetch failed: ${error.message || 'Unknown error'}`);
  }
}

export async function getOrganizationMembers() {
  try {
    // First get the organization ID for the current user
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .maybeSingle();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to find your user profile. Please ensure your profile is set up correctly.');
    }
    
    if (!userProfile || !userProfile.org_id) {
      console.error('User profile or org_id is missing');
      throw new Error('User organization not found');
    }
    
    const orgId = userProfile.org_id;
    
    // Now get all users in this organization with their roles using our custom function
    const { data, error } = await supabase
      .rpc('get_organization_members', { org_id: orgId });
      
    if (error) {
      console.error('Error fetching organization members:', error);
      throw new Error(`Failed to fetch organization members: ${error.message}`);
    }
    
    return data as TeamMember[] || [];
  } catch (error: any) {
    console.error('Error in getOrganizationMembers:', error);
    throw new Error(`Organization members fetch failed: ${error.message}`);
  }
}

export async function resendInvite(userId: string) {
  // Placeholder for resending an invitation
  console.log(`Resending invitation to user ${userId}`);
  return { success: true };
}
