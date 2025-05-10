
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";
import { getAppUserId } from "@/utils/authUtils";

export async function getTeamMembers(teamId: string) {
  try {
    // Get team members using our custom function
    const { data, error } = await supabase.functions.invoke<TeamMember[]>('get_team_members', { 
      body: { team_id: teamId }
    });
    
    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
    
    return data as TeamMember[];
  } catch (error) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}

export async function getOrganizationMembers() {
  // First get the organization ID for the current user
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id')
    .single();
    
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw profileError;
  }
  
  const orgId = userProfile.org_id;
  
  // Now get all users in this organization with their roles using our custom function
  const { data, error } = await supabase
    .rpc('get_organization_members', { org_id: orgId } as any);
    
  if (error) {
    console.error('Error fetching organization members:', error);
    throw error;
  }
  
  return data as TeamMember[];
}

export async function inviteMember(email: string, role: UserRole, teamId: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to invite a team member');
  }
  
  const currentAuthUserId = sessionData.session.user.id;
  
  // Check if the user already exists in the system by email
  const { data: existingUser, error: userError } = await supabase
    .from('app_user')
    .select('id, auth_uid')
    .eq('email', email.toLowerCase())
    .maybeSingle();
    
  if (userError) {
    console.error('Error checking existing user:', userError);
    throw userError;
  }

  // In a real implementation, we would send an invitation email
  // and create a record in an invitations table
  // For now, we'll simulate this by just logging it
  console.log(`Inviting ${email} with role ${role} to team ${teamId}`);
  
  // If the user exists, add them to the team directly
  if (existingUser) {
    try {
      const { error: addError } = await supabase.functions.invoke('add_team_member', {
        body: {
          _team_id: teamId,
          _user_id: existingUser.auth_uid, // Use auth_uid from app_user
          _role: role,
          _added_by: currentAuthUserId
        }
      });
      
      if (addError) {
        console.error('Error adding member to team:', addError);
        throw addError;
      }
      
      return { success: true };
    } catch (addError) {
      console.error('Error adding member to team:', addError);
      throw addError;
    }
  }
  
  // This would be implemented with a server-side invite flow
  // For now, we'll return a simulated success
  return { success: true, pendingInvite: true };
}

export async function resendInvite(userId: string) {
  // Placeholder for resending an invitation
  console.log(`Resending invitation to user ${userId}`);
  return { success: true };
}
