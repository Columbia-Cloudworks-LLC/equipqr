import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";

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
    // Use the add_team_member database function
    const { error: memberError } = await supabase.rpc('add_team_member', {
      _team_id: data.id,
      _user_id: userId,
      _role: 'manager',
      _added_by: userId
    } as any);
    
    if (memberError) {
      console.error('Error adding creator to team:', memberError);
      // Continue anyway as the team was created
    }
  } catch (memberError) {
    console.error('Error adding creator to team:', memberError);
    // Continue anyway as the team was created
  }
  
  return data;
}
