
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
    const { data, error } = await supabase.functions.invoke<TeamMember[]>('get_team_members', { 
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

    // Validate teamId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teamId)) {
      console.error(`Invalid UUID format for teamId: ${teamId}`);
      throw new Error("Invalid team ID format. Please select a valid team.");
    }

    // First check if the current user is a member of the team
    const { data: currentUserMembership, error: membershipError } = await supabase.functions.invoke('validate_team_access', {
      body: {
        team_id: teamId,
        user_id: currentAuthUserId
      }
    });

    if (membershipError || !currentUserMembership?.is_member) {
      console.error('Error verifying team membership:', membershipError || 'Not a team member');
      throw new Error('You do not have permission to invite members to this team.');
    }

    console.log(`Inviting ${email} with role ${role} to team ${teamId}`);
    
    // If the user exists, add them to the team directly
    if (existingUser) {
      try {
        console.log(`Existing user found with auth_uid: ${existingUser.auth_uid}`);
        
        const { data, error: addError } = await supabase.functions.invoke('add_team_member', {
          body: {
            _team_id: teamId,
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

// Add new function to check if a user is a member of a team
export async function validateTeamMembership(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      console.error('Missing userId or teamId in validateTeamMembership');
      throw new Error('User ID and Team ID are required to validate membership');
    }
    
    console.log(`Validating team membership for user ${userId} in team ${teamId}`);
    
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: {
        team_id: teamId, 
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error validating team membership:', error);
      throw new Error(`Failed to validate team membership: ${error.message}`);
    }

    console.log('Team membership validation result:', data);
    
    if (!data) {
      console.warn('No data returned from validate_team_access function');
      return false;
    }
    
    return data.is_member === true;
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    throw new Error(`Validation failed: ${error.message}`);
  }
}

// Fixed repairTeamMembership function to use the dedicated edge function
export async function repairTeamMembership(teamId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to repair team membership');
    }
    
    const userId = sessionData.session.user.id;
    console.log(`Attempting to repair team membership for user ${userId} in team ${teamId}`);
    
    // Call the repair_team_membership edge function directly
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: {
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error repairing team membership:', error);
      throw new Error(`Failed to repair team membership: ${error.message}`);
    }
    
    if (!data?.success) {
      const errorMessage = data?.error || 'Unknown error during team repair';
      console.error('Team repair failed:', errorMessage);
      throw new Error(`Repair failed: ${errorMessage}`);
    }
    
    console.log('Team membership repair successful:', data);
    return { success: true, details: data };
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw new Error(`Repair failed: ${error.message}`);
  }
}

// New function to fix team member role - assigns manager role
export async function upgradeToManagerRole(teamId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to upgrade role');
    }
    
    const userId = sessionData.session.user.id;
    console.log(`Upgrading user ${userId} to manager role in team ${teamId}`);
    
    // Use add_team_member to update the role (it handles both add and update)
    const { data, error } = await supabase.functions.invoke('add_team_member', {
      body: {
        _team_id: teamId,
        _user_id: userId, 
        _role: 'manager',
        _added_by: userId
      }
    });
    
    if (error) {
      console.error('Error upgrading to manager role:', error);
      throw new Error(`Failed to upgrade role: ${error.message}`);
    }
    
    console.log('Role upgrade successful:', data);
    return { success: true, details: data };
  } catch (error: any) {
    console.error('Error in upgradeToManagerRole:', error);
    throw new Error(`Role upgrade failed: ${error.message}`);
  }
}
