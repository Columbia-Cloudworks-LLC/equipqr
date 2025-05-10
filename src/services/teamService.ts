
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";

export async function getTeamMembers() {
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
    .rpc('get_organization_members', { org_id: orgId });
    
  if (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
  
  return data as TeamMember[];
}

export async function getTeams() {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .is('deleted_at', null);
    
  if (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
  
  return data;
}

export async function getTeamById(teamId: string) {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .eq('id', teamId)
    .is('deleted_at', null)
    .single();
    
  if (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
  
  return data;
}

export async function createTeam(name: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to create a team');
  }
  
  const userId = sessionData.session.user.id;
  
  // Get the user's organization ID
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw profileError;
  }
  
  // Create the team
  const { data, error } = await supabase
    .from('team')
    .insert({
      name,
      org_id: userProfile.org_id,
      created_by: userId
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating team:', error);
    throw error;
  }
  
  // Add the creator as a team member with 'manager' role
  try {
    // Call the add_team_member RPC function
    await supabase.rpc('add_team_member', {
      _team_id: data.id,
      _user_id: userId,
      _role: 'manager',
      _added_by: userId
    });
  } catch (memberError) {
    console.error('Error adding creator to team:', memberError);
    // Continue anyway as the team was created
  }
  
  return data;
}

export async function inviteMember(email: string, role: UserRole, teamId: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to invite a team member');
  }
  
  const currentUserId = sessionData.session.user.id;
  
  // Check if the user already exists in the system by email
  const { data: existingUser, error: userError } = await supabase
    .from('app_user')
    .select('id')
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
      await supabase.rpc('add_team_member', {
        _team_id: teamId,
        _user_id: existingUser.id,
        _role: role,
        _added_by: currentUserId
      });
      
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

export async function changeRole(userId: string, role: UserRole, teamId: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to change roles');
  }
  
  const currentUserId = sessionData.session.user.id;
  
  try {
    // First get the team_member id
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();
      
    if (memberError) {
      console.error('Error fetching team member:', memberError);
      throw memberError;
    }
    
    // Update the role
    const { error: roleError } = await supabase
      .from('team_roles')
      .upsert({
        team_member_id: teamMember.id,
        role,
        assigned_by: currentUserId
      }, { onConflict: 'team_member_id' });
      
    if (roleError) {
      console.error('Error updating role:', roleError);
      throw roleError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error changing role:', error);
    throw error;
  }
}

export async function removeMember(userId: string, teamId: string) {
  try {
    // Delete the team_member record
    const { error } = await supabase
      .from('team_member')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', teamId);
      
    if (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

export async function resendInvite(userId: string) {
  // Placeholder for resending an invitation
  console.log(`Resending invitation to user ${userId}`);
  return { success: true };
}

export async function getTeamMembers(teamId: string) {
  try {
    // Get team members using our custom function
    const { data, error } = await supabase.rpc('get_team_members', { 
      team_id: teamId 
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
