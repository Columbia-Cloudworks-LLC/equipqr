
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
    
    console.log(`Found app_user: ${appUser.id} for auth user ${userId}`);
    
    // Check user's access to the organization directly using user_roles table
    const { data: orgAccess, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();
    
    if (orgError) {
      console.log(`User has no direct role in org ${orgId}, checking team access`);
    } else {
      console.log(`User has role ${orgAccess?.role} in org ${orgId}`);
    }
    
    // Check team access using proper join structure
    const { data: teamAccess, error: teamError } = await supabase
      .from('team')
      .select(`
        id,
        name,
        team_member!inner(user_id, id)
      `)
      .eq('org_id', orgId)
      .eq('team_member.user_id', appUser.id);
    
    if (teamError) {
      console.error('Error checking team access:', teamError);
    } else {
      console.log(`User is member of ${teamAccess?.length || 0} teams in org ${orgId}`);
    }
    
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
    console.log(`Querying equipment where org_id = ${orgId} and deleted_at is null`);
    
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
    if (equipment?.length > 0) {
      console.log(`First equipment item: ${JSON.stringify(equipment[0].id)} - ${equipment[0].name}`);
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
  } catch (error: any) {
    console.error('Error in fetchUserEquipment:', error);
    return { 
      success: false, 
      equipment: [],
      error: error.message || 'Internal server error in equipment service'
    };
  }
}
