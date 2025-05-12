
import { createAdminClient } from './adminClient.ts';

// Helper function to check team access
export async function checkTeamAccess(supabase, userId, teamId) {
  try {
    console.log(`Checking team access for user ${userId} on team ${teamId}`);
    
    // Use the database function that avoids recursion
    const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
      'check_team_access_detailed',
      {
        user_id: userId,
        team_id: teamId
      }
    );
    
    if (teamAccessError) {
      console.error('Error checking team access:', teamAccessError);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: teamAccessError.message }
      };
    }
    
    // The function returns an array with one row, so we need to get the first element
    if (teamAccess && teamAccess.length > 0) {
      const accessData = teamAccess[0];
      console.log('Team access check result from function:', accessData);
      
      return {
        hasAccess: accessData.has_access,
        reason: accessData.access_reason,
        role: accessData.team_role,
        details: {
          userOrgId: accessData.user_org_id,
          teamOrgId: accessData.team_org_id,
          isTeamMember: accessData.is_team_member,
          isOrgOwner: accessData.is_org_owner
        }
      };
    }
    
    // If the function call failed or returned empty, fall back to checking cross-org access
    console.log('No result from check_team_access_detailed, checking cross-organization access');
    
    // Get the team's organization using RPC to avoid recursion
    const { data: teamOrgId } = await supabase.rpc('get_team_org', {
      team_id_param: teamId
    });
    
    if (!teamOrgId) {
      return {
        hasAccess: false,
        reason: 'team_not_found'
      };
    }
    
    // Check for cross-organization access
    const { data: orgAcl } = await supabase
      .from('organization_acl')
      .select('role')
      .eq('subject_id', userId)
      .eq('subject_type', 'user')
      .eq('org_id', teamOrgId)
      .or('expires_at.gt.now,expires_at.is.null')
      .maybeSingle();
      
    if (orgAcl) {
      console.log('Access granted: User has cross-organization access');
      return { 
        hasAccess: true, 
        reason: 'cross_org_access',
        role: orgAcl.role,
        details: {
          orgId: teamOrgId
        }
      };
    }
    
    // No access granted
    console.log('Access denied: No permission found');
    return { 
      hasAccess: false, 
      reason: 'no_permission' 
    };
  } catch (error) {
    console.error('Error in checkTeamAccess:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}

// Helper function to check team role permissions
export async function checkRolePermission(supabase, userId, teamId) {
  try {
    // Use our detailed team access function
    const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
      'check_team_access_detailed',
      {
        user_id: userId,
        team_id: teamId
      }
    );
    
    if (teamAccessError) {
      console.error('Error checking team access:', teamAccessError);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: teamAccessError.message }
      };
    }
    
    // Process the result
    if (teamAccess && teamAccess.length > 0) {
      const accessData = teamAccess[0];
      
      // Check if user has sufficient role
      if (accessData.has_access) {
        // Managers, admins and owners can change roles
        if (accessData.is_org_owner) {
          return { 
            hasAccess: true, 
            reason: 'org_role',
            role: 'owner'
          };
        }
        
        const managerRoles = ['manager', 'admin', 'owner'];
        if (accessData.team_role && managerRoles.includes(accessData.team_role)) {
          return {
            hasAccess: true,
            reason: 'team_role',
            role: accessData.team_role
          };
        }
      }
    }
    
    // No access granted
    return { 
      hasAccess: false, 
      reason: 'insufficient_permissions' 
    };
  } catch (error) {
    console.error('Error in checkRolePermission:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}
