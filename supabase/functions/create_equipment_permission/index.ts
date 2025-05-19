
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
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

/**
 * Try multiple approaches to check equipment creation permission
 */
async function tryPermissionCheck(supabase: any, user_id: string, team_id: string | null) {
  // Attempt #1: Try the check_equipment_create_permission function with explicit parameters
  try {
    console.log('Attempt #1: Using check_equipment_create_permission with explicit parameters');
    const { data, error } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: user_id,
        p_team_id: team_id
      }
    );

    if (error) throw error;
    console.log('Attempt #1 successful:', data);
    return data;
  } catch (error1) {
    console.error('Attempt #1 failed:', error1);
    
    // Attempt #2: Try the simplified_equipment_create_permission function
    try {
      console.log('Attempt #2: Using simplified_equipment_create_permission');
      const { data: simplifiedData, error: simplifiedError } = await supabase.rpc(
        'simplified_equipment_create_permission',
        { 
          p_user_id: user_id,
          p_team_id: team_id
        }
      );

      if (simplifiedError) throw simplifiedError;
      console.log('Attempt #2 successful:', simplifiedData);
      return simplifiedData;
    } catch (error2) {
      console.error('Attempt #2 failed:', error2);
      
      // Attempt #3: Try a direct database query approach with RPC function
      try {
        console.log('Attempt #3: Using rpc_check_equipment_permission function');
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'rpc_check_equipment_permission',
          { 
            user_id: user_id,
            action: 'create',
            team_id: team_id
          }
        );

        if (rpcError) throw rpcError;
        console.log('Attempt #3 successful:', rpcData);
        return rpcData;
      } catch (error3) {
        console.error('Attempt #3 failed:', error3);
        
        // All attempts failed
        throw new Error('All permission check methods failed');
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log(`Raw request body: ${rawBody}`);
    
    // Parse the request body
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return createErrorResponse(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    let { user_id, team_id } = body;
    
    // Validate parameters
    if (!user_id) {
      console.error('Missing required parameter: user_id');
      return createErrorResponse("Missing required parameter: user_id");
    }
    
    // Log parameters with types for debugging
    console.log(`Parameters received: user_id=${user_id} (${typeof user_id}), team_id=${team_id || 'null'} (${typeof team_id})`);
    
    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error(`Invalid UUID format for user_id: ${user_id}`);
      return createErrorResponse("Invalid UUID format for user_id");
    }
    
    // Handle team_id nulls and validate format if provided
    if (team_id === 'null' || team_id === 'none' || team_id === '') {
      team_id = null;
      console.log('Normalized team_id to null');
    } else if (team_id !== null && !uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return createErrorResponse("Invalid UUID format for team_id");
    }
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try multiple permission check approaches
    try {
      const permissionData = await tryPermissionCheck(supabase, user_id, team_id);
      
      // Format the response consistently regardless of the method used
      const formattedResponse = {
        can_create: permissionData.has_permission || permissionData.can_create || false,
        org_id: permissionData.org_id,
        reason: permissionData.reason || 'unknown'
      };
      
      console.log('Final permission check result:', formattedResponse);
      return createSuccessResponse(formattedResponse);
      
    } catch (error) {
      console.error('All permission check attempts failed:', error);
      
      // Provide a more specific error message based on the error
      if (error.message?.includes('operator does not exist')) {
        return createErrorResponse('Database type mismatch error. Please report this to support.');
      }
      
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return createErrorResponse('Required database functions are missing. Please contact support.');
      }
      
      return createErrorResponse(`Permission check failed: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error');
  }
});
