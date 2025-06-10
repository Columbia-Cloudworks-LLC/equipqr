
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, resource, action, resourceId, targetId } = await req.json();
    
    console.log(`Permission check: userId=${userId}, resource=${resource}, action=${action}, resourceId=${resourceId}, targetId=${targetId}`);
    
    if (!userId) {
      return createErrorResponse("Missing required parameter: userId");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle equipment permissions
    if (resource === 'equipment') {
      let permissionResult;
      
      switch (action) {
        case 'create':
          const { data: createData, error: createError } = await supabase.rpc(
            'rpc_check_equipment_permission',
            { 
              p_user_id: userId,
              p_action: 'create',
              p_team_id: targetId || null
            }
          );
          
          if (createError) throw createError;
          permissionResult = createData;
          break;
          
        case 'read':
        case 'view':
        case 'scan':
          if (!resourceId) {
            return createErrorResponse("Missing resourceId for equipment access check");
          }
          
          const { data: viewData, error: viewError } = await supabase.rpc(
            'rpc_check_equipment_permission',
            { 
              p_user_id: userId,
              p_action: 'view',
              p_equipment_id: resourceId
            }
          );
          
          if (viewError) throw viewError;
          permissionResult = viewData;
          break;
          
        case 'edit':
        case 'update':
          if (!resourceId) {
            return createErrorResponse("Missing resourceId for equipment edit check");
          }
          
          const { data: editData, error: editError } = await supabase.rpc(
            'rpc_check_equipment_permission',
            { 
              p_user_id: userId,
              p_action: 'edit',
              p_equipment_id: resourceId
            }
          );
          
          if (editError) throw editError;
          permissionResult = editData;
          break;
          
        case 'delete':
          if (!resourceId) {
            return createErrorResponse("Missing resourceId for equipment delete check");
          }
          
          // For delete, check if user can edit (same permissions)
          const { data: deleteData, error: deleteError } = await supabase.rpc(
            'rpc_check_equipment_permission',
            { 
              p_user_id: userId,
              p_action: 'edit',
              p_equipment_id: resourceId
            }
          );
          
          if (deleteError) throw deleteError;
          permissionResult = deleteData;
          break;
          
        default:
          return createErrorResponse(`Unsupported action: ${action} for equipment`);
      }
      
      return createSuccessResponse({
        has_permission: permissionResult?.has_permission || false,
        reason: permissionResult?.reason || 'Permission check completed',
        org_id: permissionResult?.org_id || null
      });
    }
    
    // Handle team permissions
    if (resource === 'team') {
      const { data: teamData, error: teamError } = await supabase.rpc(
        'check_team_access_detailed',
        {
          user_id: userId,
          team_id: resourceId || targetId
        }
      );
      
      if (teamError) throw teamError;
      
      if (!teamData || teamData.length === 0) {
        return createSuccessResponse({
          has_permission: false,
          reason: 'No team access data found'
        });
      }
      
      const accessInfo = teamData[0];
      return createSuccessResponse({
        has_permission: accessInfo.has_access || false,
        reason: accessInfo.access_reason || 'Team access check completed',
        role: accessInfo.team_role,
        org_id: accessInfo.team_org_id
      });
    }
    
    // Handle organization permissions
    if (resource === 'organization') {
      const { data: orgRole, error: orgError } = await supabase.rpc(
        'get_org_role',
        {
          p_auth_user_id: userId,
          p_org_id: resourceId || targetId
        }
      );
      
      if (orgError) throw orgError;
      
      return createSuccessResponse({
        has_permission: !!orgRole,
        reason: orgRole ? 'Organization member' : 'Not an organization member',
        role: orgRole,
        org_id: resourceId || targetId
      });
    }
    
    return createErrorResponse(`Unsupported resource type: ${resource}`);
    
  } catch (error) {
    console.error('Permission check error:', error);
    return createErrorResponse(
      `Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});
