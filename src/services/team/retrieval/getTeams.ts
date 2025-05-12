
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Get all teams including those from the user's organization
 */
export async function getTeams() {
  try {
    console.log('Fetching all teams for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
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
    
    if (appUserError || !appUser) {
      console.error('Error getting app_user ID:', appUserError);
      throw new Error('Failed to get user information');
    }
    
    // Get teams from user's organization
    const { data: orgTeams, error: orgError } = await supabase
      .from('team')
      .select('*')
      .is('deleted_at', null);
      
    if (orgError) {
      console.error('Error fetching org teams:', orgError);
      throw orgError;
    }
    
    // Get teams the user is a member of (regardless of organization)
    const { data: memberTeams, error: memberError } = await supabase
      .from('team_member')
      .select('team:team_id(*)')
      .eq('user_id', appUser.id);
      
    if (memberError) {
      console.error('Error fetching member teams:', memberError);
      // If we fail to get member teams, at least return org teams
      return orgTeams || [];
    }
    
    // Combine teams from both sources, removing duplicates
    const teamsMap = new Map();
    
    // Add org teams
    (orgTeams || []).forEach(team => {
      teamsMap.set(team.id, team);
    });
    
    // Add member teams if they're not already in the map
    (memberTeams || []).forEach(membership => {
      if (membership.team && !teamsMap.has(membership.team.id) && !membership.team.deleted_at) {
        teamsMap.set(membership.team.id, membership.team);
      }
    });
    
    // Convert the map back to an array
    const allTeams = Array.from(teamsMap.values());
    console.log(`Successfully fetched ${allTeams.length} teams (${orgTeams?.length || 0} org + ${memberTeams?.length || 0} member)`);
    
    return allTeams;
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
}
