
/**
 * Direct database queries for equipment data (fallback when edge functions fail)
 */
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processEquipmentList } from "../utils/equipmentFormatting";
import { cacheEquipmentResults } from "../caching/equipmentCache";

/**
 * Fallback function using direct query if edge function fails
 */
export async function getEquipmentDirectQuery(userId: string): Promise<Equipment[]> {
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
      cacheEquipmentResults(processedData, userId);
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
    cacheEquipmentResults(processedData, userId);
    return processedData;
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return []; 
  }
}
