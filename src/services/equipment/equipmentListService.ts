
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processEquipmentList } from "./utils/equipmentFormatting";

/**
 * Get all equipment items including those from teams the user belongs to
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.error('User must be logged in to view equipment');
      throw new Error('User must be logged in to view equipment');
    }

    const userId = sessionData.session.user.id;
    console.log('Authenticated user ID:', userId);
    
    // Use the edge function to get equipment
    const { data, error } = await supabase.functions.invoke('list_user_equipment', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('Error fetching equipment via edge function:', error);
      
      // Fallback to direct query if the edge function fails
      return getEquipmentDirectQuery(userId);
    }
    
    // Validate that we received an array
    if (!Array.isArray(data)) {
      console.error('Invalid response from list_user_equipment function:', data);
      return [];
    }
    
    console.log(`Successfully fetched ${data.length} equipment items via edge function`);
    
    // Process the data to ensure all properties are set correctly
    return processEquipmentList(data);
  } catch (error) {
    console.error('Error in getEquipment:', error);
    
    // Fallback to direct query if there's an exception
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        return await getEquipmentDirectQuery(userId);
      }
      return [];
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; 
    }
  }
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
      
      return processEquipmentList(orgEquipment || []);
    }
    
    // Get teams the user is a member of
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUser.id);
      
    if (teamError) {
      console.error('Error fetching team memberships:', teamError);
      // Just return organization equipment if we can't get team memberships
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
      
      return processEquipmentList(orgEquipment || []);
    }
    
    // Build query with proper filtering
    let query = supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null);
    
    // Filter by organization first
    query = query.eq('org_id', userOrgId);
    
    // If user belongs to teams, also include those teams' equipment
    if (teamMemberships && teamMemberships.length > 0) {
      const teamIds = teamMemberships.map(tm => tm.team_id);
      
      // Create a new query that combines both filters with OR
      query = supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name, org_id),
          org:org_id (name)
        `)
        .is('deleted_at', null)
        .or(`org_id.eq.${userOrgId},team_id.in.(${teamIds.join(',')})`);
    }
    
    // Execute query
    const { data: equipment, error } = await query.order('name');
    
    if (error) {
      console.error('Error in direct equipment query:', error);
      return []; 
    }
    
    console.log(`Successfully fetched ${equipment?.length || 0} equipment items via direct query`);
    return processEquipmentList(equipment || []);
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return []; 
  }
}

// Export the direct query function for testing purposes
export { getEquipmentDirectQuery };
