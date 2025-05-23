
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
    const { data: appUser, error: userError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (userError || !appUser) {
      console.error('Error fetching app_user:', userError);
      return { 
        success: false, 
        equipment: [],
        error: userError?.message || "Could not find app_user record" 
      };
    }
    
    // Check user's access to the organization - use user_roles table instead of organization_members
    const { data: orgAccess, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();
    
    // Check team access using proper join structure
    const { data: teamAccess, error: teamError } = await supabase
      .from('team')
      .select('id')
      .eq('org_id', orgId)
      .eq('team_member.user_id', appUser.id) // Use proper join based on app_user ID
      .limit(1);
    
    const hasOrgAccess = !orgError && orgAccess;
    const hasTeamAccess = !teamError && teamAccess && teamAccess.length > 0;
    
    // If user has no role in this org and no teams, they don't have access to its equipment
    if (!hasOrgAccess && !hasTeamAccess) {
      console.log(`User ${userId} has no access to organization ${orgId}`);
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
      console.error('Error fetching equipment:', error);
      return { 
        success: false, 
        equipment: [],
        error: error.message || "Failed to fetch equipment data"
      };
    }
    
    console.log(`Found ${equipment?.length || 0} equipment records for org ${orgId}`);
    
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
