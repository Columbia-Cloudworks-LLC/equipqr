
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface PermissionRequest {
  userId: string;
  resource: 'equipment' | 'team' | 'organization';
  action: 'create' | 'read' | 'edit' | 'delete' | 'manage_members';
  resourceId?: string;
  targetId?: string;
}

interface PermissionResponse {
  has_permission: boolean;
  reason: string;
  org_id?: string;
  role?: string;
  details?: any;
}

function createSuccessResponse(data: PermissionResponse) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

async function checkEquipmentPermissions(
  supabase: any,
  userId: string,
  action: string,
  resourceId?: string,
  targetId?: string
): Promise<PermissionResponse> {
  console.log(`Checking equipment permission: user=${userId}, action=${action}, resourceId=${resourceId}, targetId=${targetId}`);
  
  try {
    if (action === 'create') {
      // Equipment creation permission
      const { data, error } = await supabase.rpc('check_equipment_create_permission', {
        p_user_id: userId,
        p_team_id: targetId || null,
        p_org_id: resourceId || null
      });
      
      if (error) {
        console.error('Equipment create permission error:', error);
        return { has_permission: false, reason: `Database error: ${error.message}` };
      }
      
      if (!data || data.length === 0) {
        return { has_permission: false, reason: 'No permission data returned' };
      }
      
      return {
        has_permission: data[0].has_permission,
        reason: data[0].reason,
        org_id: data[0].org_id
      };
    }
    
    if ((action === 'read' || action === 'edit' || action === 'delete') && resourceId) {
      // Equipment access/edit permission
      const rpcAction = action === 'read' ? 'view' : action;
      const { data, error } = await supabase.rpc('rpc_check_equipment_permission', {
        user_id: userId,
        action: rpcAction,
        equipment_id: resourceId
      });
      
      if (error) {
        console.error('Equipment permission error:', error);
        return { has_permission: false, reason: `Database error: ${error.message}` };
      }
      
      return {
        has_permission: data?.has_permission || false,
        reason: data?.reason || 'Permission check completed'
      };
    }
    
    return { has_permission: false, reason: 'Invalid equipment action or missing resourceId' };
  } catch (error) {
    console.error('Equipment permission check failed:', error);
    return { has_permission: false, reason: `Error: ${error.message}` };
  }
}

async function checkTeamPermissions(
  supabase: any,
  userId: string,
  action: string,
  resourceId?: string,
  targetId?: string
): Promise<PermissionResponse> {
  console.log(`Checking team permission: user=${userId}, action=${action}, resourceId=${resourceId}, targetId=${targetId}`);
  
  try {
    if (action === 'read' && resourceId) {
      // Team access validation with enhanced organization role check
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
      
      const { data: teamData } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', resourceId)
        .single();
      
      if (!userProfile || !teamData) {
        return { has_permission: false, reason: 'User or team not found' };
      }
      
      // Enhanced same organization check with role detection
      if (userProfile.org_id === teamData.org_id) {
        // Get user's organization role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('org_id', teamData.org_id)
          .single();
        
        return { 
          has_permission: true, 
          reason: 'same_org',
          role: userRole?.role || 'viewer',
          details: { 
            user_org_id: userProfile.org_id, 
            team_org_id: teamData.org_id,
            is_member: false,
            has_org_access: true,
            org_role: userRole?.role || 'viewer'
          }
        };
      }
      
      // Check team membership for cross-org access
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      if (appUser) {
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', resourceId)
          .single();
        
        if (teamMember) {
          // Get team role
          const { data: teamRole } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .single();
          
          return { 
            has_permission: true, 
            reason: 'team_member',
            role: teamRole?.role || 'viewer',
            details: { 
              is_member: true,
              has_cross_org_access: true,
              user_org_id: userProfile.org_id,
              team_org_id: teamData.org_id
            }
          };
        }
      }
      
      return { has_permission: false, reason: 'not_team_member' };
    }
    
    if (action === 'manage_members' && resourceId) {
      // Enhanced team role permission check with organization roles
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
      
      const { data: teamData } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', resourceId)
        .single();
      
      if (!userProfile || !teamData) {
        return { has_permission: false, reason: 'User or team not found' };
      }
      
      // Check if user is organization owner/manager for this team's org
      if (userProfile.org_id === teamData.org_id) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('org_id', teamData.org_id)
          .single();
        
        if (userRole && ['owner', 'manager'].includes(userRole.role)) {
          return {
            has_permission: true,
            reason: 'org_role_permission',
            role: userRole.role,
            details: { org_role: userRole.role }
          };
        }
      }
      
      // Fallback to original team role check
      const { data, error } = await supabase.functions.invoke('check_team_role_permission', {
        body: {
          auth_user_id: userId,
          team_id: resourceId,
          target_user_id: targetId,
          role: 'manager'
        }
      });
      
      if (error) {
        console.error('Team role permission error:', error);
        return { has_permission: false, reason: `Permission check error: ${error.message}` };
      }
      
      return {
        has_permission: data?.can_change || false,
        reason: data?.reason || 'Team role check completed'
      };
    }
    
    return { has_permission: false, reason: 'Invalid team action or missing resourceId' };
  } catch (error) {
    console.error('Team permission check failed:', error);
    return { has_permission: false, reason: `Error: ${error.message}` };
  }
}

async function checkOrganizationPermissions(
  supabase: any,
  userId: string,
  action: string,
  resourceId?: string
): Promise<PermissionResponse> {
  console.log(`Checking organization permission: user=${userId}, action=${action}, resourceId=${resourceId}`);
  
  try {
    if (!resourceId) {
      return { has_permission: false, reason: 'Organization ID required' };
    }
    
    // Check if user belongs to organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (!userProfile || userProfile.org_id !== resourceId) {
      return { has_permission: false, reason: 'User not in organization' };
    }
    
    // For read access, being in the org is sufficient
    if (action === 'read') {
      return { has_permission: true, reason: 'org_member' };
    }
    
    // For other actions, check role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', resourceId)
      .single();
    
    if (!userRole) {
      return { has_permission: false, reason: 'No role in organization' };
    }
    
    const hasPermission = ['owner', 'manager'].includes(userRole.role);
    return {
      has_permission: hasPermission,
      reason: hasPermission ? 'sufficient_role' : 'insufficient_role',
      role: userRole.role
    };
  } catch (error) {
    console.error('Organization permission check failed:', error);
    return { has_permission: false, reason: `Error: ${error.message}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, resource, action, resourceId, targetId }: PermissionRequest = await req.json();
    
    if (!userId || !resource || !action) {
      return createErrorResponse('Missing required parameters: userId, resource, and action are required');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    let result: PermissionResponse;
    
    switch (resource) {
      case 'equipment':
        result = await checkEquipmentPermissions(supabase, userId, action, resourceId, targetId);
        break;
      case 'team':
        result = await checkTeamPermissions(supabase, userId, action, resourceId, targetId);
        break;
      case 'organization':
        result = await checkOrganizationPermissions(supabase, userId, action, resourceId);
        break;
      default:
        return createErrorResponse(`Unknown resource type: ${resource}`);
    }
    
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Unified permissions error:', error);
    return createErrorResponse(`Permission check failed: ${error.message}`);
  }
});
