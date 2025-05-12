
import { createAdminClient } from './adminClient.ts';

// Helper function to check equipment access permissions
export async function checkEquipmentAccess(supabase, userId, equipmentId) {
  try {
    console.log(`Checking equipment access for user ${userId} on equipment ${equipmentId}`);
    
    // First get the equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();
    
    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return { 
        hasAccess: false, 
        reason: 'equipment_not_found' 
      };
    }
    
    console.log('Equipment details:', equipment);
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return { 
        hasAccess: false, 
        reason: 'user_not_found' 
      };
    }
    
    console.log('User profile:', userProfile);
    
    // First check: User is from the same organization as the equipment
    if (userProfile.org_id === equipment.org_id) {
      console.log('Access granted: User is from the same organization as the equipment');
      return { 
        hasAccess: true, 
        reason: 'same_org',
        role: 'member' 
      };
    }
    
    // Second check: If equipment belongs to a team
    if (equipment.team_id) {
      console.log(`Equipment belongs to team ${equipment.team_id}, checking team access`);
      
      // Using RPC to check team access without causing recursion
      const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
        'check_team_access_detailed',
        {
          user_id: userId,
          team_id: equipment.team_id
        }
      );
      
      if (teamAccessError) {
        console.error('Error checking team access:', teamAccessError);
      }
      
      if (teamAccess && teamAccess.length > 0 && teamAccess[0].has_access) {
        console.log('Access granted via team membership check:', teamAccess[0]);
        return {
          hasAccess: true,
          reason: teamAccess[0].access_reason,
          role: teamAccess[0].team_role || 'viewer',
          details: {
            teamId: equipment.team_id,
            teamOrgId: teamAccess[0].team_org_id,
            accessMethod: 'team_access_function'
          }
        };
      }
      
      // Fallback: Check for app_user mapping (legacy method)
      // First get app_user ID for this auth user
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .maybeSingle();
        
      if (appUser?.id) {
        console.log(`Found app_user ID ${appUser.id} for auth user ${userId}`);
        
        // Check team membership with app_user ID
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .maybeSingle();
          
        if (teamMember?.id) {
          console.log('Access granted: User is a direct team member');
          
          // Get role for this team member
          const { data: teamRole } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .maybeSingle();
            
          return { 
            hasAccess: true, 
            reason: 'team_member',
            role: teamRole?.role || 'viewer',
            details: {
              teamId: equipment.team_id,
              teamMemberId: teamMember.id,
              accessMethod: 'direct_team_membership'
            }
          };
        }
      }
      
      // Check for cross-organization access via organization_acl
      console.log('Checking cross-organization access');
      const { data: orgAcl } = await supabase
        .from('organization_acl')
        .select('role')
        .eq('subject_id', userId)
        .eq('subject_type', 'user')
        .eq('org_id', equipment.org_id)
        .or('expires_at.gt.now,expires_at.is.null')
        .maybeSingle();
        
      if (orgAcl) {
        console.log('Access granted: User has cross-organization access');
        return { 
          hasAccess: true, 
          reason: 'cross_org_access',
          role: orgAcl.role,
          details: {
            orgId: equipment.org_id,
            accessMethod: 'organization_acl'
          }
        };
      }
    }
    
    // No access granted
    console.log('Access denied: No permission found');
    return { 
      hasAccess: false, 
      reason: 'no_permission' 
    };
  } catch (error) {
    console.error('Error in checkEquipmentAccess:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}
