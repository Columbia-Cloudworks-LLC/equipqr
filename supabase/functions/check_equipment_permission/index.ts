
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/adminClient.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, equipment_id, team_id, action } = body;
    
    console.log(`Permission check request: ${JSON.stringify(body)}`);
    
    if (!user_id) {
      console.error("Missing user_id parameter");
      return createErrorResponse("Missing required parameter: user_id");
    }

    if (!action) {
      console.error("Missing action parameter");
      return createErrorResponse("Missing action parameter: specify 'create', 'edit', or 'view'");
    }
    
    if (action !== 'create' && !equipment_id) {
      console.error("Missing equipment_id parameter for non-create action");
      return createErrorResponse("Equipment ID is required for edit, delete, and view actions");
    }
    
    // Create Supabase client with service role to bypass RLS
    const adminClient = createAdminClient();
    
    // Check if request is using service role - if so, grant automatic permission
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.includes('service_role')) {
      console.log("Service role detected, granting permission automatically");
      return createSuccessResponse({
        has_permission: true,
        reason: 'service_role'
      });
    }

    // Use our new RPC function that avoids recursion
    const { data: permissionData, error: permissionError } = await adminClient.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id,
        action,
        team_id: team_id || null,
        equipment_id: equipment_id || null
      }
    );
    
    if (permissionError) {
      console.error('Error checking permission:', permissionError);
      return createErrorResponse(`Permission check failed: ${permissionError.message}`);
    }
    
    console.log('Permission check result:', permissionData);
    
    return createSuccessResponse(permissionData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
