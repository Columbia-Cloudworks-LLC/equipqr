
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Get all teams including those from the user's organization
 */
export async function getTeams() {
  try {
    console.log('Fetching all teams for current user');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error('Authentication error. Please sign in again.');
    }
    
    if (!sessionData?.session?.user) {
      console.warn('No authenticated user found');
      throw new Error('User must be logged in to view teams');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Auth user ID:', authUserId);
    
    // First, get app_user ID for the current auth user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .maybeSingle();
    
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      throw new Error('Failed to get user information');
    }
    
    if (!appUser) {
      console.error('No app_user found for auth user ID:', authUserId);
      throw new Error('User profile not found. Please contact support.');
    }
    
    console.log('App user ID:', appUser.id);
    
    // Get user's profile to determine organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }
    
    const userOrgId = userProfile?.org_id;
    console.log('User organization ID:', userOrgId);
    
    // Get teams the user is a member of (regardless of organization)
    const { data: memberTeams, error: memberError } = await supabase
      .from('team_member')
      .select(`
        team:team_id (
          id,
          name,
          org_id,
          created_by,
          organization:org_id (name)
        )
      `)
      .eq('user_id', appUser.id);
      
    if (memberError) {
      console.error('Error fetching member teams:', memberError);
      throw memberError;
    }
    
    console.log('Teams user is a member of:', memberTeams?.length || 0);
    
    // Get teams from user's organization
    let orgTeams = [];
    if (userOrgId) {
      const { data: fetchedOrgTeams, error: orgError } = await supabase
        .from('team')
        .select(`
          id, 
          name, 
          org_id,
          created_by,
          organization:org_id (name)
        `)
        .eq('org_id', userOrgId)
        .is('deleted_at', null);
        
      if (orgError) {
        console.error('Error fetching org teams:', orgError);
      } else {
        orgTeams = fetchedOrgTeams || [];
        console.log('Teams in user organization:', orgTeams.length);
      }
    }
    
    // Teams created by the user
    const { data: createdTeams, error: createdError } = await supabase
      .from('team')
      .select(`
        id, 
        name, 
        org_id,
        created_by,
        organization:org_id (name)
      `)
      .eq('created_by', authUserId)
      .is('deleted_at', null);
    
    if (createdError) {
      console.error('Error fetching teams created by user:', createdError);
    } else {
      console.log('Teams created by user:', createdTeams?.length || 0);
    }
    
    // Combine teams from all sources, removing duplicates
    const teamsMap = new Map();
    
    // Process member teams
    (memberTeams || []).forEach(membership => {
      if (membership.team && !membership.team.deleted_at) {
        const team = {
          id: membership.team.id,
          name: membership.team.name,
          org_id: membership.team.org_id,
          org_name: membership.team.organization?.name,
          is_external_org: userOrgId && membership.team.org_id !== userOrgId
        };
        teamsMap.set(team.id, team);
      }
    });
    
    // Add org teams
    orgTeams.forEach(team => {
      if (!teamsMap.has(team.id)) {
        teamsMap.set(team.id, {
          id: team.id,
          name: team.name,
          org_id: team.org_id,
          org_name: team.organization?.name,
          is_external_org: false
        });
      }
    });
    
    // Add created teams
    (createdTeams || []).forEach(team => {
      if (!teamsMap.has(team.id)) {
        teamsMap.set(team.id, {
          id: team.id,
          name: team.name,
          org_id: team.org_id,
          org_name: team.organization?.name,
          is_external_org: userOrgId && team.org_id !== userOrgId
        });
      }
    });
    
    // Convert the map back to an array
    const allTeams = Array.from(teamsMap.values());
    console.log(`Successfully fetched ${allTeams.length} teams in total`);
    
    return allTeams;
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
}
