
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";
import { getAppUserId } from "@/utils/authUtils";

export async function getTeamMembers(teamId: string) {
  try {
    console.log(`Fetching team members for team: ${teamId}`);
    
    if (!teamId) {
      console.warn('No teamId provided to getTeamMembers');
      return [];
    }
    
    // Get team members using our edge function
    const { data, error } = await supabase.functions.invoke<TeamMember[]>('get_team_members', { 
      body: { team_id: String(teamId) } // Explicitly convert to string
    });
    
    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message || 'Unknown error'}`);
    }
    
    if (!data) {
      console.warn('No team members found or data is null');
      return [];
    }
    
    return data as TeamMember[];
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

export async function inviteMember(email: string, role: UserRole, teamId: string) {
  try {
    // Get the current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to invite a team member');
    }
    
    const currentAuthUserId = sessionData.session.user.id;
    console.log(`Current auth user ID: ${currentAuthUserId}`);
    
    // Check if the user already exists in the system by email
    const { data: existingUser, error: userError } = await supabase
      .from('app_user')
      .select('id, auth_uid')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking existing user:', userError);
      throw new Error(`Failed to check if user exists: ${userError.message}`);
    }

    // In a real implementation, we would send an invitation email
    // and create a record in an invitations table
    console.log(`Inviting ${email} with role ${role} to team ${teamId}`);
    
    // If the user exists, add them to the team directly
    if (existingUser) {
      try {
        console.log(`Existing user found with auth_uid: ${existingUser.auth_uid}`);
        
        const { data, error: addError } = await supabase.functions.invoke('add_team_member', {
          body: {
            _team_id: String(teamId), // Explicitly convert to string
            _user_id: existingUser.auth_uid, 
            _role: role,
            _added_by: currentAuthUserId
          }
        });
        
        if (addError) {
          console.error('Error adding member to team:', addError);
          throw new Error(`Failed to add member to team: ${addError.message}`);
        }
        
        console.log('Team member added successfully:', data);
        return { success: true };
      } catch (addError: any) {
        console.error('Error adding member to team:', addError);
        throw new Error(`Failed to add member to team: ${addError.message}`);
      }
    }
    
    // This would be implemented with a server-side invite flow
    // For now, we'll return a simulated success
    return { success: true, pendingInvite: true };
  } catch (error: any) {
    console.error('Error in inviteMember:', error);
    throw new Error(`Invitation failed: ${error.message}`);
  }
}

export async function resendInvite(userId: string) {
  // Placeholder for resending an invitation
  console.log(`Resending invitation to user ${userId}`);
  return { success: true };
}
