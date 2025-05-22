
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { saveEquipmentCache } from "../caching/equipmentCache";

/**
 * Direct database query fallback for equipment
 */
export async function getEquipmentDirectQuery(userId: string, orgId?: string): Promise<Equipment[]> {
  try {
    console.log('Using direct equipment query for user', userId);
    
    // First get the user's app_user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError) {
      console.error('Error getting app_user:', appUserError);
      return [];
    }
    
    const appUserId = appUser.id;
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error getting user profile:', profileError);
    }
    
    const userOrgId = userProfile?.org_id;
    
    // If org_id is specified, check if user has access to it
    if (orgId) {
      const hasAccess = await checkOrgAccess(userId, appUserId, orgId);
      if (!hasAccess) {
        console.log('User does not have access to organization:', orgId);
        return [];
      }
    }
    
    // 1. Get equipment from user's org (or specific org if provided)
    const targetOrgId = orgId || userOrgId;
    
    let allEquipment: Equipment[] = [];
    if (targetOrgId) {
      // Get organization name first
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('name')
        .eq('id', targetOrgId)
        .single();
      
      const orgName = orgData?.name || 'Unknown Organization';
      
      // Then get the equipment with the org name
      const { data: orgEquipment, error: orgEquipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('org_id', targetOrgId)
        .is('deleted_at', null);
      
      if (orgEquipmentError) {
        console.error('Error getting organization equipment:', orgEquipmentError);
      } else if (orgEquipment) {
        allEquipment = [...orgEquipment.map(item => ({ 
          ...item,
          org_name: orgName 
        }))];
      }
    }
    
    // 2. For teams, we need to get them separately if not from the user's organization
    // If we're not filtering by a specific org, or if we're looking at an external org
    if (!orgId || (orgId && orgId !== userOrgId)) {
      // Get teams the user is a member of
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('team_member')
        .select('team_id')
        .eq('user_id', appUserId);
      
      if (userTeamsError) {
        console.error('Error getting user teams:', userTeamsError);
      } else if (userTeams && userTeams.length > 0) {
        const teamIds = userTeams.map(t => t.team_id);
        
        // If filtering by org_id, we need to first filter to teams in that org
        if (orgId) {
          const { data: teamsInOrg, error: teamsInOrgError } = await supabase
            .from('team')
            .select('id, name, org_id, organization:org_id(name)')
            .in('id', teamIds)
            .eq('org_id', orgId);
          
          if (teamsInOrgError) {
            console.error('Error filtering teams by org:', teamsInOrgError);
          } else if (teamsInOrg && teamsInOrg.length > 0) {
            const filteredTeamIds = teamsInOrg.map(t => t.id);
            
            // Get equipment from these teams
            const { data: teamEquipment, error: teamEquipmentError } = await supabase
              .from('equipment')
              .select('*')
              .in('team_id', filteredTeamIds)
              .is('deleted_at', null);
            
            if (teamEquipmentError) {
              console.error('Error getting team equipment:', teamEquipmentError);
            } else if (teamEquipment) {
              // Add to equipment list, avoiding duplicates and ensuring org name
              teamEquipment.forEach(item => {
                if (!allEquipment.some(eq => eq.id === item.id)) {
                  const team = teamsInOrg.find(t => t.id === item.team_id);
                  const orgName = team?.organization?.name || 'Unknown Organization';
                  
                  allEquipment.push({ 
                    ...item,
                    team_name: team?.name,
                    org_name: orgName
                  });
                }
              });
            }
          }
        } else {
          // No org filter, get equipment from all user's teams with org details
          // First get teams with their org details
          const { data: teamsWithOrgs, error: teamsWithOrgsError } = await supabase
            .from('team')
            .select('id, name, org_id, organization:org_id(name)')
            .in('id', teamIds);
          
          if (teamsWithOrgsError) {
            console.error('Error getting teams with orgs:', teamsWithOrgsError);
          } else if (teamsWithOrgs) {
            // Now get equipment for these teams
            const { data: teamEquipment, error: teamEquipmentError } = await supabase
              .from('equipment')
              .select('*')
              .in('team_id', teamIds)
              .is('deleted_at', null);
            
            if (teamEquipmentError) {
              console.error('Error getting team equipment:', teamEquipmentError);
            } else if (teamEquipment) {
              // Add to equipment list, avoiding duplicates and ensuring org name
              teamEquipment.forEach(item => {
                if (!allEquipment.some(eq => eq.id === item.id)) {
                  const team = teamsWithOrgs.find(t => t.id === item.team_id);
                  const orgName = team?.organization?.name || 'Unknown Organization';
                  
                  allEquipment.push({ 
                    ...item,
                    team_name: team?.name,
                    org_name: orgName
                  });
                }
              });
            }
          }
        }
      }
    }
    
    // Save to cache and return
    const cacheKey = orgId ? `${userId}_${orgId}` : userId;
    saveEquipmentCache(cacheKey, allEquipment);
    
    return allEquipment;
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return [];
  }
}

// Helper function to check if user has access to an organization
async function checkOrgAccess(userId: string, appUserId: string, orgId: string): Promise<boolean> {
  try {
    // 1. Check direct organization membership via user_roles
    const { data: userRole, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (userRole) {
      return true;
    }
    
    // 2. Check team memberships in this organization
    const { data: teams, error: teamsError } = await supabase
      .from('team')
      .select('id')
      .eq('org_id', orgId);
    
    if (teamsError || !teams || teams.length === 0) {
      return false;
    }
    
    const teamIds = teams.map(t => t.id);
    
    const { data: teamMemberships, error: membershipError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUserId)
      .in('team_id', teamIds)
      .limit(1);
    
    return !membershipError && teamMemberships && teamMemberships.length > 0;
  } catch (error) {
    console.error('Error checking org access:', error);
    return false;
  }
}
