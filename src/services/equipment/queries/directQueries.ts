
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { checkOrgAccess } from "./helpers/accessCheck";
import { getUserIdentifiers } from "./helpers/userIdentifier";
import { getOrganizationEquipment } from "./parts/organizationEquipment";
import { 
  getTeamsEquipment, 
  getUserTeamIds, 
  filterTeamsByOrg 
} from "./parts/teamEquipment";
import { cacheEquipmentData } from "./helpers/equipmentCache";

/**
 * Direct database query fallback for equipment
 * @param userId User ID
 * @param orgId Optional organization ID filter
 * @returns Array of equipment items
 */
export async function getEquipmentDirectQuery(userId: string, orgId?: string): Promise<Equipment[]> {
  try {
    console.log('Using direct equipment query for user', userId);
    
    // Get user's IDs and organization
    const { appUserId, userOrgId } = await getUserIdentifiers(userId);
    
    if (!appUserId) {
      console.error('Could not get app_user ID for user', userId);
      return [];
    }
    
    // If org_id is specified, check if user has access to it
    if (orgId && appUserId) {
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
      const orgEquipment = await getOrganizationEquipment(targetOrgId);
      allEquipment = [...orgEquipment];
    }
    
    // 2. For teams, we need to get them separately if not from the user's organization
    // If we're not filtering by a specific org, or if we're looking at an external org
    if (appUserId && (!orgId || (orgId && orgId !== userOrgId))) {
      // Get all teams the user is a member of
      const userTeamIds = await getUserTeamIds(appUserId);
      
      if (userTeamIds.length > 0) {
        // If filtering by org_id, filter to teams in that org
        const teamIds = orgId 
          ? await filterTeamsByOrg(userTeamIds, orgId) 
          : userTeamIds;
        
        if (teamIds.length > 0) {
          // Get equipment from these teams
          const teamEquipment = await getTeamsEquipment(teamIds);
          
          // Add to equipment list, avoiding duplicates
          teamEquipment.forEach(item => {
            if (!allEquipment.some(eq => eq.id === item.id)) {
              allEquipment.push(item);
            }
          });
        }
      }
    }
    
    // Save to cache and return
    cacheEquipmentData(userId, allEquipment, orgId);
    
    return allEquipment;
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return [];
  }
}
