/**
 * Direct database queries for equipment data (fallback when edge functions fail)
 */
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processEquipmentList } from "../utils/equipmentFormatting";
import { cacheEquipmentResults } from "../caching/equipmentCache";

/**
 * Fallback function using direct query if edge function fails
 * @param userId The authenticated user's ID
 * @param orgId Optional organization ID to filter by
 */
export async function getEquipmentDirectQuery(userId: string, orgId?: string): Promise<Equipment[]> {
  try {
    console.log('Using fallback direct query for equipment', orgId ? `filtered by orgId: ${orgId}` : '');
    
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
    
    // Get user's role in the requested organization (if specified)
    let userRole = null;
    if (orgId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();
      
      userRole = roleData?.role;
    }
    
    // Get user's app_user ID for team membership lookup
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      // If we can't get app_user, just return organization equipment
      
      // If specific org requested, filter by that
      const targetOrgId = orgId || userOrgId;
      
      // If user is just a viewer in that org, they should have limited access
      // Otherwise, if they are owner/manager/admin, they can see all org equipment
      if (orgId && userRole === 'viewer') {
        // For viewers, only show equipment from teams they belong to
        // First get their team IDs
        const { data: teamMemberships } = await supabase
          .from('team_member')
          .select('team_id')
          .eq('user_id', appUser?.id || '');
          
        const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
        
        if (teamIds.length === 0) {
          return []; // No teams, no equipment access for viewers
        }
        
        // Get equipment assigned to those teams
        const { data: teamEquipment, error: teamEquipmentError } = await supabase
          .from('equipment')
          .select(`
            *,
            team:team_id (name, org_id),
            org:org_id (name)
          `)
          .in('team_id', teamIds)
          .is('deleted_at', null)
          .order('name');
        
        if (teamEquipmentError) {
          console.error('Error fetching team equipment:', teamEquipmentError);
          return [];
        }
        
        const processedData = processEquipmentList(teamEquipment || []);
        // Cache the results with org ID in the cache key
        cacheEquipmentResults(processedData, `${userId}_${orgId}`);
        return processedData;
      } else {
        // For managers/owners or when viewing own org, show all org equipment
        const { data: orgEquipment, error: orgEquipmentError } = await supabase
          .from('equipment')
          .select(`
            *,
            team:team_id (name, org_id),
            org:org_id (name)
          `)
          .eq('org_id', targetOrgId)
          .is('deleted_at', null)
          .order('name');
          
        if (orgEquipmentError) {
          console.error('Error fetching organization equipment:', orgEquipmentError);
          return [];
        }
        
        const processedData = processEquipmentList(orgEquipment || []);
        // Cache the results with appropriate cache key
        const cacheKey = orgId ? `${userId}_${orgId}` : userId;
        cacheEquipmentResults(processedData, cacheKey);
        return processedData;
      }
    }
    
    // If specific organization is requested
    if (orgId) {
      // For viewers, restrict to team-based access
      if (userRole === 'viewer') {
        // Get teams the user is a member of within this org
        const { data: teams } = await supabase
          .from('team')
          .select('id')
          .eq('org_id', orgId)
          .is('deleted_at', null);
          
        if (!teams || teams.length === 0) {
          return []; // No teams in this org, no access for viewers
        }
        
        const teamIds = teams.map(team => team.id);
        
        // Check which of these teams the user belongs to
        const { data: teamMemberships } = await supabase
          .from('team_member')
          .select('team_id')
          .eq('user_id', appUser.id)
          .in('team_id', teamIds);
          
        const userTeamIds = teamMemberships?.map(tm => tm.team_id) || [];
        
        if (userTeamIds.length === 0) {
          return []; // User not in any teams in this org, no access
        }
        
        // Get equipment for these teams
        const { data: equipment, error } = await supabase
          .from('equipment')
          .select(`
            *,
            team:team_id (name, org_id),
            org:org_id (name)
          `)
          .in('team_id', userTeamIds)
          .is('deleted_at', null)
          .order('name');
          
        if (error) {
          console.error('Error in viewer equipment query:', error);
          return [];
        }
        
        const processedData = processEquipmentList(equipment || []);
        cacheEquipmentResults(processedData, `${userId}_${orgId}`);
        return processedData;
      }
      
      // For managers/owners, show all equipment in the org
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name, org_id),
          org:org_id (name)
        `)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('name');
        
      if (error) {
        console.error('Error in manager/owner equipment query:', error);
        return [];
      }
      
      const processedData = processEquipmentList(equipment || []);
      cacheEquipmentResults(processedData, `${userId}_${orgId}`);
      return processedData;
    }
    
    // No specific org requested - get all equipment user has access to
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
    // Cache the results with the user ID as a parameter
    cacheEquipmentResults(processedData, userId);
    return processedData;
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return []; 
  }
}
