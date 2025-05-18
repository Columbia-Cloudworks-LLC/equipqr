
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { toast } from "sonner";

const CACHE_KEY = 'cached_user_teams';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: any[];
  timestamp: number;
}

/**
 * Get all teams for the current user, including those from other organizations where
 * the user has been granted access through organization_acl
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
    
    // Check cache first
    const cachedTeams = checkCache();
    if (cachedTeams) {
      console.log(`Using ${cachedTeams.length} cached teams`);
      return cachedTeams;
    }
    
    // Try the edge function first with a short timeout
    try {
      // Clear any cached data before making the new request to ensure fresh data
      clearCache();
      
      console.log('Calling get_user_teams edge function...');
      const data = await invokeEdgeFunction('get_user_teams', { user_id: authUserId }, 8000);
      
      // Check if data is properly structured
      if (!data || !Array.isArray(data.teams)) {
        console.error('Invalid response structure from get_user_teams:', data);
        throw new Error('Invalid response from server');
      }
      
      console.log(`Successfully fetched ${data.teams.length || 0} teams via edge function`);
      
      // Cache the results
      cacheResults(data.teams);
      
      return data.teams || [];
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Use fallback direct query approach
      return await getTeamsFallback(authUserId);
    }
  } catch (error) {
    console.error('Error in getTeams:', error);
    
    // Show a toast with the error unless it's already being shown elsewhere
    if (!error.message?.includes('must be logged in')) {
      toast.error("Error loading teams", {
        description: "Please try refreshing the page"
      });
    }
    
    throw error;
  }
}

/**
 * Fallback function to get teams using direct database queries
 */
async function getTeamsFallback(userId: string) {
  try {
    console.log('Using fallback direct query for teams');
    
    // 1. Get user's organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (!userProfile?.org_id) {
      console.warn('No organization found for user');
      return [];
    }
    
    // 2. Get teams from user's organization
    const { data: orgTeams, error: orgTeamsError } = await supabase
      .from('team')
      .select(`
        id,
        name,
        org_id,
        organization:org_id (name)
      `)
      .eq('org_id', userProfile.org_id)
      .is('deleted_at', null);
      
    if (orgTeamsError) {
      console.error('Error fetching organization teams:', orgTeamsError);
      return [];
    }
    
    // 3. Get user's app_user ID - FIXED: Use auth_uid to correctly fetch app_user
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (!appUser?.id) {
      console.warn('No app_user found');
      // Return org teams if we have them
      return orgTeams?.map(team => ({
        ...team,
        org_name: team.organization?.name,
        is_external_org: false
      })) || [];
    }
    
    // 4. Get teams user is a member of (including external orgs)
    const { data: memberTeams, error: memberTeamsError } = await supabase
      .from('team_member')
      .select(`
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (name)
        ),
        team_roles!team_member_id(role)
      `)
      .eq('user_id', appUser.id);
      
    if (memberTeamsError) {
      console.error('Error fetching member teams:', memberTeamsError);
      // Return org teams if we have them
      return orgTeams?.map(team => ({
        ...team,
        org_name: team.organization?.name,
        is_external_org: false
      })) || [];
    }
    
    // Process member teams
    const externalTeams = memberTeams
      ?.filter(item => item.team?.org_id !== userProfile.org_id && item.team !== null)
      .map(item => {
        // Extract role from team_roles relationship
        const role = item.team_roles && item.team_roles.length > 0 ? 
          item.team_roles[0]?.role : null;
          
        return {
          id: item.team.id,
          name: item.team.name,
          org_id: item.team.org_id,
          org_name: item.team.organization?.name,
          is_external_org: true,
          role // Fixed: Include role in the team object
        };
      }) || [];
      
    // Process org teams
    const internalTeams = orgTeams?.map(team => ({
      id: team.id,
      name: team.name,
      org_id: team.org_id,
      org_name: team.organization?.name,
      is_external_org: false
    })) || [];
    
    // Combine and deduplicate
    const allTeams = [...internalTeams];
    
    // Add external teams if they're not already in the list
    externalTeams.forEach(extTeam => {
      if (!allTeams.some(team => team.id === extTeam.id)) {
        allTeams.push(extTeam);
      } else {
        // Update existing team with role information
        const existingTeam = allTeams.find(team => team.id === extTeam.id);
        if (existingTeam) {
          (existingTeam as any).role = extTeam.role; // Fixed: Use type assertion to add role property
        }
      }
    });
    
    console.log(`Successfully fetched ${allTeams.length} teams via fallback query`);
    
    // Cache the results
    cacheResults(allTeams);
    
    return allTeams;
  } catch (error) {
    console.error('Error in getTeamsFallback:', error);
    return [];
  }
}

/**
 * Cache team results in localStorage
 */
function cacheResults(teams: any[]) {
  try {
    const cacheData: CachedData = {
      data: teams,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache teams:', error);
  }
}

/**
 * Check for valid cached teams data
 */
function checkCache(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached) as CachedData;
    const now = Date.now();
    
    // Return cached data if it's still within TTL
    if (now - parsedCache.timestamp < CACHE_TTL) {
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read cached teams:', error);
    return null;
  }
}

/**
 * Clear the team cache
 */
function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear team cache:', error);
  }
}
