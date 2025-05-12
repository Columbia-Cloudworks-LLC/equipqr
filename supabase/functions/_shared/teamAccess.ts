
// Helper functions to check team access permissions
// Now leverages the database security definer functions instead of custom logic

// Helper function to check team access
export async function checkTeamAccess(supabase, userId, teamId) {
  try {
    console.log(`Checking team access for user ${userId} on team ${teamId}`);
    
    // Use the new can_access_team function
    const { data, error } = await supabase.rpc('can_access_team', {
      p_uid: userId,
      p_team_id: teamId
    });
    
    if (error) {
      console.error('Error checking team access:', error);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: error.message }
      };
    }
    
    if (data === true) {
      // Get team role if they're a member
      let role = null;
      
      const { data: roleData } = await supabase.rpc('get_team_role_safe', {
        _user_id: userId,
        _team_id: teamId
      });
      
      if (roleData) {
        role = roleData;
      } else {
        // Check if they're an org owner
        const { data: teamData } = await supabase.rpc('get_team_org', {
          team_id_param: teamId
        });
        
        if (teamData) {
          // Check if user is an org owner
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('org_id', teamData)
            .eq('role', 'owner')
            .maybeSingle();
            
          if (userRoles) {
            role = 'owner';
          }
        }
      }
      
      return {
        hasAccess: true,
        reason: 'permission_granted',
        role: role,
        details: {}
      };
    }
    
    // No access granted
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
    // Get team's org first
    const { data: teamOrgId } = await supabase.rpc('get_team_org', {
      team_id_param: teamId
    });
    
    if (!teamOrgId) {
      return { 
        hasAccess: false, 
        reason: 'team_not_found'
      };
    }
    
    // Check if user is org owner
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', teamOrgId)
      .eq('role', 'owner')
      .maybeSingle();
      
    if (userRoles) {
      return { 
        hasAccess: true, 
        reason: 'org_role',
        role: 'owner'
      };
    }
    
    // Check if user has manager role in the team
    const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
      _user_id: userId,
      _team_id: teamId
    });
    
    const managerRoles = ['manager', 'owner'];
    if (teamRole && managerRoles.includes(teamRole)) {
      return {
        hasAccess: true,
        reason: 'team_role',
        role: teamRole
      };
    }
    
    // No permission
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
