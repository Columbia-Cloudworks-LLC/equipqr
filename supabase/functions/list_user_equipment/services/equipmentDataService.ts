
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
 * Combine all equipment sources and eliminate duplicates
 */
function combineEquipment(equipmentSources: any[][]): any[] {
  // Flatten all equipment sources into a single array
  const allEquipment = equipmentSources.reduce((acc, source) => [...acc, ...source], []);
  
  // Deduplicate by equipment ID
  return allEquipment.filter((item, index, self) =>
    index === self.findIndex((eq) => eq.id === item.id)
  );
}

/**
 * Main function to fetch all equipment for a user with access control
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
    
    // 1. Get equipment from user's teams
    const teamEquipment = await fetchTeamEquipment(appUserId, orgId);
    
    // 2. Get equipment from user's organizations
    const orgEquipment = await fetchOrgEquipment(userId, orgId);
    
    // 3. If orgId is specified, get direct equipment from that org
    let directOrgEquipment: any[] = [];
    if (orgId) {
      directOrgEquipment = await fetchDirectOrgEquipment(orgId);
    }
    
    // Combine all equipment sources and deduplicate
    const uniqueEquipment = combineEquipment([teamEquipment, orgEquipment, directOrgEquipment]);
    
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
