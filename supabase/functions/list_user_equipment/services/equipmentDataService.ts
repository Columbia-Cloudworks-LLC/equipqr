import { getAppUserId } from "./appUserService.ts";
import { checkUserOrgAccess } from "./userOrgService.ts";
import { fetchTeamEquipment } from "./teamEquipmentService.ts";
import { fetchOrgEquipment } from "./orgEquipmentService.ts";
import { fetchDirectOrgEquipment } from "./directOrgEquipmentService.ts";

interface EquipmentResult {
  success: boolean;
  equipment: any[];
  error?: string;
}

/**
 * Improved equipment combining with data source prioritization
 */
function combineEquipment(equipmentSources: any[][]): any[] {
  // Flatten all equipment sources into a single array with source tracking
  const allEquipment = equipmentSources.reduce((acc, source, sourceIndex) => {
    const sourceNames = ['team', 'org', 'direct_org'];
    const sourceName = sourceNames[sourceIndex] || `source_${sourceIndex}`;
    
    return [...acc, ...source.map(item => ({
      ...item,
      _source_index: sourceIndex,
      _source_name: sourceName
    }))];
  }, []);
  
  // Group by equipment ID and prioritize sources with complete data
  const equipmentMap = new Map();
  
  allEquipment.forEach(item => {
    const existingItem = equipmentMap.get(item.id);
    
    if (!existingItem) {
      equipmentMap.set(item.id, item);
    } else {
      // Prioritize items with team names over those without
      const currentHasTeamName = Boolean(item.team_name);
      const existingHasTeamName = Boolean(existingItem.team_name);
      
      if (currentHasTeamName && !existingHasTeamName) {
        console.log(`Equipment ${item.id}: Prioritizing ${item._source_name} over ${existingItem._source_name} (has team name)`);
        equipmentMap.set(item.id, item);
      } else if (!currentHasTeamName && existingHasTeamName) {
        console.log(`Equipment ${item.id}: Keeping ${existingItem._source_name} over ${item._source_name} (has team name)`);
        // Keep existing
      } else {
        // If both have team names or both don't, prioritize by source order (team > org > direct_org)
        if (item._source_index < existingItem._source_index) {
          console.log(`Equipment ${item.id}: Prioritizing ${item._source_name} over ${existingItem._source_name} (better source)`);
          equipmentMap.set(item.id, item);
        }
      }
    }
  });
  
  // Remove internal tracking properties and return
  return Array.from(equipmentMap.values()).map(item => {
    const { _source_index, _source_name, ...cleanItem } = item;
    return cleanItem;
  });
}

/**
 * Main function to fetch all equipment for a user with improved data consistency
 */
export async function fetchUserEquipment(userId: string, orgId?: string): Promise<EquipmentResult> {
  try {
    console.log(`Fetching equipment for user: ${userId}${orgId ? `, filtered by org: ${orgId}` : ''}`);
    
    // Get app_user ID for this auth user
    const appUserId = await getAppUserId(userId);
    
    if (!appUserId) {
      return { 
        success: false, 
        equipment: [],
        error: "Could not find app_user record" 
      };
    }
    
    // If org_id is specified, check user's access to that organization
    if (orgId) {
      const { userRole, hasTeams } = await checkUserOrgAccess(userId, orgId);
      
      // If user has no role in this org and no teams, they don't have access to its equipment
      if (!userRole && !hasTeams) {
        return { 
          success: true, 
          equipment: [], 
          error: "User has no access to this organization" 
        };
      }
    }
    
    // Fetch equipment from all sources with improved logging
    console.log('Fetching equipment from team source...');
    const teamEquipment = await fetchTeamEquipment(appUserId, orgId);
    console.log(`Team equipment: ${teamEquipment.length} items`);
    
    console.log('Fetching equipment from org source...');
    const orgEquipment = await fetchOrgEquipment(userId, orgId);
    console.log(`Org equipment: ${orgEquipment.length} items`);
    
    let directOrgEquipment: any[] = [];
    if (orgId) {
      console.log('Fetching equipment from direct org source...');
      directOrgEquipment = await fetchDirectOrgEquipment(orgId);
      console.log(`Direct org equipment: ${directOrgEquipment.length} items`);
    }
    
    // Combine all equipment sources with improved deduplication
    const uniqueEquipment = combineEquipment([teamEquipment, orgEquipment, directOrgEquipment]);
    
    console.log(`Final combined equipment: ${uniqueEquipment.length} items`);
    
    // Log summary of team name resolution
    const withTeamNames = uniqueEquipment.filter(item => item.team_name).length;
    const withoutTeamNames = uniqueEquipment.filter(item => !item.team_name).length;
    console.log(`Team name resolution: ${withTeamNames} with team names, ${withoutTeamNames} without`);
    
    return { success: true, equipment: uniqueEquipment };
  } catch (error) {
    console.error('Error in fetchUserEquipment:', error);
    return { 
      success: false, 
      equipment: [],
      error: error.message || "Internal server error" 
    };
  }
}
