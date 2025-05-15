
// Inlining shared code instead of using imports
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined CORS headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inlined success response function from _shared/cors.ts
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

// Inlined error response function from _shared/cors.ts
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

// Inlined admin client function from _shared/adminClient.ts
function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
}

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

    // Use our optimized RPC function that avoids recursion
    const { data: permissionData, error: permissionError } = await adminClient.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: user_id,
        action: action,
        team_id: team_id || null,
        equipment_id: equipment_id || null
      }
    );
    
    if (permissionError) {
      console.error('Error checking permission:', permissionError);
      return createErrorResponse(`Permission check failed: ${permissionError.message}`);
    }
    
    console.log('Permission check result:', permissionData);
    
    // Explicitly structure the response to match the TypeScript interface
    const formattedResponse = {
      has_permission: permissionData?.has_permission || false,
      org_id: permissionData?.org_id || null,
      reason: permissionData?.reason || 'unknown'
    };
    
    return createSuccessResponse(formattedResponse);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
