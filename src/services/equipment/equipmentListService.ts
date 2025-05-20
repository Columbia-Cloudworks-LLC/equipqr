
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processEquipmentList } from "./utils/equipmentFormatting";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";

// Include user ID in cache key to prevent using data from previous users
const getCacheKey = (userId: string) => `cached_user_equipment_${userId}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: Equipment[];
  timestamp: number;
}

/**
 * Get all equipment items including those from teams the user belongs to
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      throw new Error('Failed to authenticate user');
    }
    
    if (!sessionData?.session?.user) {
      console.error('User is not authenticated, cannot fetch equipment');
      throw new Error('User must be logged in to view equipment');
    }

    const userId = sessionData.session.user.id;
    console.log('Authenticated user ID:', userId);
    
    const cacheKey = getCacheKey(userId);
    
    // Check cache first but skip if cache busting is requested
    if (!window.localStorage.getItem('equipment_cache_bust')) {
      const cachedEquipment = checkCache(userId);
      if (cachedEquipment) {
        console.log(`Using ${cachedEquipment.length} cached equipment items for user ${userId.slice(0, 8)}...`);
        return cachedEquipment;
      }
    } else {
      // Clear cache busting flag after use
      window.localStorage.removeItem('equipment_cache_bust');
    }
    
    // Try the edge function first
    try {
      const data = await invokeEdgeFunction('list_user_equipment', { user_id: userId }, 8000);
      
      // FIX: Add better validation to prevent app errors
      if (!data) {
        console.error('Invalid response from list_user_equipment function: null or undefined');
        throw new Error('Empty response from equipment service');
      }
      
      // Validate that we received an array
      if (!Array.isArray(data)) {
        console.error('Invalid response from list_user_equipment function:', data);
        throw new Error('Invalid response format from equipment service');
      }
      
      console.log(`Successfully fetched ${data.length} equipment items via edge function`);
      
      // Process the data to ensure all properties are set correctly
      const processedData = processEquipmentList(data);
      
      // Cache the results (with the user ID as a parameter)
      cacheResults(processedData, userId);
      
      return processedData;
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Fall back to direct query
      return await getEquipmentDirectQuery(userId);
    }
  } catch (error) {
    console.error('Error in getEquipment:', error);
    
    // Show more context about the error without disrupting UI
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Fallback to direct query if there's an exception
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        return await getEquipmentDirectQuery(userId);
      }
      
      // FIX: Return empty array instead of throwing to prevent breaking other features
      console.warn('Returning empty equipment list due to errors');
      return []; 
    } catch (fallbackError) {
      console.error('Equipment fallback also failed:', fallbackError);
      
      // FIX: Return empty array instead of throwing to prevent breaking other features
      console.warn('Returning empty equipment list due to errors in fallback');
      return []; 
    }
  }
}

/**
 * Force refresh equipment data by busting the cache
 */
export async function refreshEquipment(): Promise<Equipment[]> {
  try {
    // Set cache bust flag
    window.localStorage.setItem('equipment_cache_bust', 'true');
    
    // Clear existing user-specific cache
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      window.localStorage.removeItem(getCacheKey(sessionData.session.user.id));
    }
    
    // Fetch fresh data
    return getEquipment();
  } catch (error) {
    // FIX: Handle refresh errors gracefully
    console.error('Error refreshing equipment:', error);
    return [];
  }
}

/**
 * Clear all equipment caches (used during login/logout)
 */
export function clearEquipmentCache(): void {
  console.log('Clearing all equipment caches');
  
  // Find and clear all equipment cache entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cached_user_equipment_')) {
      localStorage.removeItem(key);
    }
  }
  
  // Also remove the general cache bust flag
  localStorage.removeItem('equipment_cache_bust');
}

/**
 * Fallback function using direct query if edge function fails
 */
async function getEquipmentDirectQuery(userId: string): Promise<Equipment[]> {
  try {
    console.log('Using fallback direct query for equipment');
    
    // First, get user's organization ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return [];
    }
    
    const userOrgId = userProfile.org_id;
    
    // Get user's app_user ID for team membership lookup
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      // If we can't get app_user, just return organization equipment
      const { data: orgEquipment, error: orgEquipmentError } = await supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name, org_id),
          org:org_id (name)
        `)
        .eq('org_id', userOrgId)
        .is('deleted_at', null)
        .order('name');
        
      if (orgEquipmentError) {
        console.error('Error fetching organization equipment:', orgEquipmentError);
        return [];
      }
      
      const processedData = processEquipmentList(orgEquipment || []);
      // Cache the results (with the user ID as a parameter)
      cacheResults(processedData, userId);
      return processedData;
    }
    
    // Get teams the user is a member of
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUser.id);
      
    // Build query with proper filtering
    let query = supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null);
    
    // If user belongs to teams, also include those teams' equipment
    if (teamMemberships && teamMemberships.length > 0) {
      const teamIds = teamMemberships.map(tm => tm.team_id);
      
      // Create a query that combines both filters with OR
      query = supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name, org_id),
          org:org_id (name)
        `)
        .is('deleted_at', null)
        .or(`org_id.eq.${userOrgId},team_id.in.(${teamIds.join(',')})`)
        .order('name');
    } else {
      // Just filter by organization
      query = query.eq('org_id', userOrgId).order('name');
    }
    
    // Execute query
    const { data: equipment, error } = await query;
    
    if (error) {
      console.error('Error in direct equipment query:', error);
      return []; 
    }
    
    console.log(`Successfully fetched ${equipment?.length || 0} equipment items via direct query`);
    const processedData = processEquipmentList(equipment || []);
    // Cache the results (with the user ID as a parameter)
    cacheResults(processedData, userId);
    return processedData;
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return []; 
  }
}

/**
 * Cache equipment results in localStorage
 */
function cacheResults(equipment: Equipment[], userId: string) {
  try {
    const cacheKey = getCacheKey(userId);
    const cacheData: CachedData = {
      data: equipment,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache equipment:', error);
  }
}

/**
 * Check for valid cached equipment data
 */
function checkCache(userId: string): Equipment[] | null {
  try {
    const cacheKey = getCacheKey(userId);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached) as CachedData;
    const now = Date.now();
    
    // Return cached data if it's still within TTL
    if (now - parsedCache.timestamp < CACHE_TTL) {
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read cached equipment:', error);
    return null;
  }
}

// Export the direct query function for testing purposes
export { getEquipmentDirectQuery };
