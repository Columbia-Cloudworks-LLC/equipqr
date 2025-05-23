
/**
 * Service for fetching user equipment
 */
interface EquipmentResult {
  success: boolean;
  equipment: any[];
  error?: string;
}

/**
 * Fetch equipment for a specific user, filtered by org_id
 */
export async function fetchUserEquipment(supabase: any, userId: string, orgId?: string): Promise<EquipmentResult> {
  try {
    // Require orgId parameter to prevent unfiltered data access
    if (!orgId) {
      console.warn('fetchUserEquipment called without an organization ID - returning empty array');
      return { 
        success: true,
        equipment: []
      };
    }
    
    console.log(`Fetching equipment for user ${userId} filtered by orgId: ${orgId}`);
    
    // First get app_user ID for this auth user
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userProfile) {
      return { 
        success: false, 
        equipment: [],
        error: "Could not find user profile" 
      };
    }
    
    // Check user's access to the organization
    const { data: orgAccess, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();
    
    const { data: teamAccess, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('org_id', orgId)
      .eq('team_members.user_id', userId)
      .limit(1);
    
    const hasOrgAccess = !orgError && orgAccess;
    const hasTeamAccess = !teamError && teamAccess && teamAccess.length > 0;
    
    // If user has no role in this org and no teams, they don't have access to its equipment
    if (!hasOrgAccess && !hasTeamAccess) {
      return { 
        success: true, 
        equipment: [], 
        error: "User has no access to this organization" 
      };
    }
    
    // Get equipment with mandatory organization filter
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        org:org_id (name),
        team:team_id (name, org_id)
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null);
    
    if (error) {
      return { 
        success: false, 
        equipment: [],
        error: error.message || "Failed to fetch equipment data"
      };
    }
    
    // Process equipment to ensure org_name is available
    const processedData = equipment ? equipment.map((item: any) => ({
      ...item,
      org_name: item.org?.name || 'Unknown Organization',
      team_name: item.team?.name || null
    })) : [];
    
    return { 
      success: true, 
      equipment: processedData
    };
  } catch (error) {
    console.error('Error in fetchUserEquipment:', error);
    return { 
      success: false, 
      equipment: [],
      error: error.message || 'Internal server error in equipment service'
    };
  }
}
