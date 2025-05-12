
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Get all teams including those from the user's organization
 * This function uses multiple targeted queries to avoid RLS recursions
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
    
    // Get teams the user is a member of directly
    const { data: teamMemberships, error: membershipError } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUser.id);
    
    if (membershipError) {
      console.error('Error fetching team memberships:', membershipError);
    }
    
    const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
    console.log('Teams user is a member of (IDs):', teamIds);
    
    let memberTeams = [];
    // Fetch team details separately to avoid RLS recursion issues
    if (teamIds.length > 0) {
      const { data: teams, error: teamsError } = await supabase
        .from('team')
        .select('id, name, org_id')
        .in('id', teamIds)
        .is('deleted_at', null);
        
      if (teamsError) {
        console.error('Error fetching member teams:', teamsError);
      } else {
        memberTeams = teams || [];
        
        // For each team, get the org name separately
        const teamsWithOrgNames = await Promise.all(
          memberTeams.map(async (team) => {
            if (team.org_id) {
              const { data: org } = await supabase
                .from('organization')
                .select('name')
                .eq('id', team.org_id)
                .single();
                
              return {
                ...team,
                org_name: org?.name,
                is_external_org: userOrgId && team.org_id !== userOrgId
              };
            }
            return team;
          })
        );
        
        memberTeams = teamsWithOrgNames;
      }
    }
    
    console.log('Fetched member teams with details:', memberTeams.length);
    
    // Get teams from user's organization
    let orgTeams = [];
    if (userOrgId) {
      const { data: fetchedOrgTeams, error: orgError } = await supabase
        .from('team')
        .select('id, name, org_id')
        .eq('org_id', userOrgId)
        .is('deleted_at', null);
        
      if (orgError) {
        console.error('Error fetching org teams:', orgError);
      } else {
        // Add org name to each team
        const { data: org } = await supabase
          .from('organization')
          .select('name')
          .eq('id', userOrgId)
          .single();
          
        orgTeams = (fetchedOrgTeams || []).map(team => ({
          ...team,
          org_name: org?.name,
          is_external_org: false
        }));
        
        console.log('Teams in user organization:', orgTeams.length);
      }
    }
    
    // Teams created by the user
    const { data: createdTeams, error: createdError } = await supabase
      .from('team')
      .select('id, name, org_id')
      .eq('created_by', authUserId)
      .is('deleted_at', null);
    
    let createdTeamsWithOrgNames = [];
    if (createdError) {
      console.error('Error fetching teams created by user:', createdError);
    } else {
      // Add org name to each team
      createdTeamsWithOrgNames = await Promise.all(
        (createdTeams || []).map(async (team) => {
          if (team.org_id) {
            const { data: org } = await supabase
              .from('organization')
              .select('name')
              .eq('id', team.org_id)
              .single();
              
            return {
              ...team,
              org_name: org?.name,
              is_external_org: userOrgId && team.org_id !== userOrgId
            };
          }
          return team;
        })
      );
      
      console.log('Teams created by user:', createdTeamsWithOrgNames.length);
    }
    
    // Combine teams from all sources, removing duplicates
    const teamsMap = new Map();
    
    // Add member teams
    memberTeams.forEach(team => {
      teamsMap.set(team.id, team);
    });
    
    // Add org teams
    orgTeams.forEach(team => {
      if (!teamsMap.has(team.id)) {
        teamsMap.set(team.id, team);
      }
    });
    
    // Add created teams
    createdTeamsWithOrgNames.forEach(team => {
      if (!teamsMap.has(team.id)) {
        teamsMap.set(team.id, team);
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
