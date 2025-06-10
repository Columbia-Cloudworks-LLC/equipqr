
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
      
      try {
        if (action === 'create') {
          console.log('Using check_equipment_create_permission for create action');
          
          // Use the dedicated create permission function with prefixed parameters
          const { data: createData, error: createError } = await supabase.rpc(
            'check_equipment_create_permission',
            {
              p_user_id: userId,
              p_team_id: targetId || null,
              p_org_id: null // Let the function determine the org
            }
          );

          if (createError) {
            console.error('Create permission check error:', createError);
            throw new Error(`Create permission check failed: ${createError.message}`);
          }

          console.log('Create permission result:', createData);
          
          // The function returns a table, so we need the first row
          const createResult = Array.isArray(createData) ? createData[0] : createData;
          
          return createSuccessResponse({
            has_permission: createResult?.has_permission || false,
            reason: createResult?.reason || 'Create permission check completed',
            org_id: createResult?.org_id || null
          });
          
        } else {
          console.log(`Using rpc_check_equipment_permission for ${action} action with non-prefixed parameters`);
          
          // Map client actions to database function actions
          let dbAction = action;
          if (action === 'read') dbAction = 'view';
          
          // Use non-prefixed parameters for the general permission function
          const rpcParams = {
            user_id: userId,
            action: dbAction,
            team_id: targetId || null,
            equipment_id: resourceId || null
          };
          
          console.log('RPC parameters (non-prefixed):', JSON.stringify(rpcParams, null, 2));
          
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'rpc_check_equipment_permission',
            rpcParams
          );

          if (rpcError) {
            console.error('Database RPC error details:', {
              message: rpcError.message,
              details: rpcError.details,
              hint: rpcError.hint,
              code: rpcError.code
            });
            throw new Error(`Database permission check failed: ${rpcError.message}`);
          }

          console.log('RPC response data:', JSON.stringify(rpcData, null, 2));
          permissionResult = rpcData;
          
          return createSuccessResponse({
            has_permission: permissionResult?.has_permission || false,
            reason: permissionResult?.reason || 'Permission check completed',
            org_id: permissionResult?.org_id || null
          });
        }
        
      } catch (error) {
        console.error('Equipment permission check failed:', error);
        
        // Enhanced error details for debugging
        const errorDetails = {
          error_type: 'permission_check_failure',
          original_error: error.message,
          resource,
          action,
          userId: userId.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        };
        
        return createErrorResponse(
          `Permission check failed: ${error.message}. Details: ${JSON.stringify(errorDetails)}`,
          500
        );
      }
    }
    
    // Handle team permissions
    if (resource === 'team') {
      try {
        console.log(`Calling check_team_access_detailed for team ${resourceId || targetId}`);
        
        const { data: teamData, error: teamError } = await supabase.rpc(
          'check_team_access_detailed',
          {
            user_id: userId,
            team_id: resourceId || targetId
          }
        );
        
        if (teamError) {
          console.error('Team access check error:', teamError);
          throw teamError;
        }
        
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
        
      } catch (error) {
        console.error('Team permission check failed:', error);
        return createErrorResponse(`Team permission check failed: ${error.message}`, 500);
      }
    }
    
    // Handle organization permissions
    if (resource === 'organization') {
      try {
        console.log(`Calling get_org_role for org ${resourceId || targetId}`);
        
        const { data: orgRole, error: orgError } = await supabase.rpc(
          'get_org_role',
          {
            p_auth_user_id: userId,
            p_org_id: resourceId || targetId
          }
        );
        
        if (orgError) {
          console.error('Organization role check error:', orgError);
          throw orgError;
        }
        
        return createSuccessResponse({
          has_permission: !!orgRole,
          reason: orgRole ? 'Organization member' : 'Not an organization member',
          role: orgRole,
          org_id: resourceId || targetId
        });
        
      } catch (error) {
        console.error('Organization permission check failed:', error);
        return createErrorResponse(`Organization permission check failed: ${error.message}`, 500);
      }
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
