
import { createAdminClient } from "./adminClient.ts";

interface EquipmentResult {
  success: boolean;
  equipment: any[];
  error?: string;
}

export async function fetchUserEquipment(userId: string, orgId?: string): Promise<EquipmentResult> {
  try {
    const adminClient = createAdminClient();
    
    console.log(`Fetching equipment for user: ${userId}${orgId ? `, filtered by org: ${orgId}` : ''}`);
    
    // Get app_user ID for this auth user
    const { data: appUserData, error: appUserError } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return { 
        success: false, 
        equipment: [],
        error: "Could not find app_user record" 
      };
    }
    
    const appUserId = appUserData.id;
  
    // If org_id is specified, check user's role in that organization
    let userRole = null;
    
    // Also check if the user has teams in this organization
    let hasTeams = false;
    
    if (orgId) {
      // Get user's role in the organization
      const { data: roleData, error: roleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error fetching user role:', roleError);
      } else if (roleData) {
        userRole = roleData.role;
      }
      
      // Check if user has any teams in this organization
      const { data: appUserData } = await adminClient
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
        
      if (appUserData?.id) {
        const { data: teamMemberships, error: teamError } = await adminClient
          .from('team_member')
          .select('team_id, team:team_id (org_id)')
          .eq('user_id', appUserData.id);
          
        if (!teamError && teamMemberships) {
          hasTeams = teamMemberships.some(tm => tm.team?.org_id === orgId);
        }
      }
      
      // If user has no role in this org and no teams, they don't have access to its equipment
      if (!userRole && !hasTeams) {
        return { 
          success: true, 
          equipment: [], 
          error: "User has no access to this organization" 
        };
      }
    }

    // 1. Get equipment from user's teams with improved organization data
    let teamEquipmentQuery = adminClient
      .from('team_member')
      .select(`
        user_id,
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (
            id,
            name
          ),
          equipment:equipment (
            *
          )
        )
      `)
      .eq('user_id', appUserId);
    
    const { data: teamMemberships, error: teamError } = await teamEquipmentQuery;
    
    if (teamError) {
      console.error('Error getting team equipment:', teamError);
    }
    
    // Extract equipment items from team memberships
    let teamEquipment = [];
    if (teamMemberships) {
      teamMemberships.forEach(membership => {
        // Skip if team or equipment is missing or team belongs to a different org than requested
        if (!membership.team || !membership.team.equipment) return;
        if (orgId && membership.team.org_id !== orgId) return;
        
        teamEquipment = [
          ...teamEquipment,
          ...membership.team.equipment
            .filter(item => !item.deleted_at)
            .map(item => ({
              ...item,
              access_via: 'team',
              team_name: membership.team.name,
              org_name: membership.team.organization ? membership.team.organization.name : 'Unknown Organization'
            }))
        ];
      });
    }
    
    // 2. Get equipment from user's organizations with improved organization name resolution
    let userOrgQuery = adminClient
      .from('user_profiles')
      .select(`
        org:org_id (
          id,
          name,
          equipment (
            *
          )
        )
      `)
      .eq('id', userId);
    
    const { data: userOrgs, error: userOrgError } = await userOrgQuery;
    
    if (userOrgError) {
      console.error('Error getting user org equipment:', userOrgError);
    }
    
    // Extract equipment items from user organizations
    let orgEquipment = [];
    if (userOrgs && userOrgs.length > 0) {
      userOrgs.forEach(userOrg => {
        // Skip if org or equipment is missing or org doesn't match requested org
        if (!userOrg.org || !userOrg.org.equipment) return;
        if (orgId && userOrg.org.id !== orgId) return;
        
        orgEquipment = [
          ...orgEquipment,
          ...userOrg.org.equipment
            .filter(item => !item.deleted_at)
            .map(item => ({
              ...item,
              access_via: 'org',
              org_name: userOrg.org.name
            }))
        ];
      });
    }
    
    // 3. If orgId is specified and user has role/access, get direct equipment from that org
    let directOrgEquipment = [];
    if (orgId && (userRole || hasTeams)) {
      // First, get the organization name
      const { data: orgData, error: orgError } = await adminClient
        .from('organization')
        .select('name')
        .eq('id', orgId)
        .single();
      
      if (orgError) {
        console.error('Error getting organization name:', orgError);
      }
      
      const orgName = orgData?.name || 'Unknown Organization';
      
      // Then get the equipment with team information
      const { data: orgEq, error: orgEqError } = await adminClient
        .from('equipment')
        .select(`
          *,
          team:team_id (
            id,
            name
          )
        `)
        .eq('org_id', orgId)
        .is('deleted_at', null);
      
      if (orgEqError) {
        console.error('Error getting direct org equipment:', orgEqError);
      } else if (orgEq) {
        directOrgEquipment = orgEq.map(item => ({
          ...item,
          access_via: 'direct_org',
          org_name: orgName,
          team_name: item.team?.name || null // Include team name from the joined data
        }));
      }
    }
    
    // Combine all equipment sources and deduplicate
    const allEquipment = [...teamEquipment, ...orgEquipment, ...directOrgEquipment];
    const uniqueEquipment = allEquipment.filter((item, index, self) =>
      index === self.findIndex((eq) => eq.id === item.id)
    );
    
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
