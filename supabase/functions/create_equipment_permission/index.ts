
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
    
    const { user_id, team_id } = body;
    
    // Validate parameters
    if (!user_id) {
      console.error('Missing required parameter: user_id');
      return createErrorResponse("Missing required parameter: user_id");
    }
    
    // Log parameters for debugging
    console.log(`Parameters received: user_id=${user_id} (${typeof user_id}), team_id=${team_id || 'null'} (${typeof team_id})`);
    
    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error(`Invalid UUID format for user_id: ${user_id}`);
      return createErrorResponse("Invalid UUID format for user_id");
    }
    
    // If team_id is provided, validate it as well
    if (team_id && team_id !== 'null' && team_id !== 'none' && !uuidRegex.test(team_id)) {
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
    
    // Prepare parameters for the database function call
    const functionParams: Record<string, any> = {
      p_user_id: user_id,
      // Handle different null/none values that might be passed from frontend
      p_team_id: (team_id && team_id !== 'none' && team_id !== 'null') ? team_id : null
    };
    
    console.log('Calling DB function check_equipment_create_permission with params:', functionParams);
    
    // Call the database function with explicit parameters
    const { data, error } = await supabase.rpc(
      'check_equipment_create_permission',
      functionParams
    );
    
    // Log the result or error
    if (error) {
      console.error('Database function error details:', error);
      
      // Check for specific type mismatch errors
      if (error.message && error.message.includes('operator does not exist')) {
        console.error('Type mismatch error detected. This is often caused by UUID vs string comparison issues.');
        return createErrorResponse(`Permission check failed due to type mismatch: ${error.message}`);
      }
      
      return createErrorResponse(`Permission check failed: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.error('Permission check returned no data');
      return createErrorResponse('Invalid response from permission check');
    }
    
    console.log('Permission check result:', data);
    
    // The check_equipment_create_permission function returns rows, so take the first one
    const permissionData = data[0];
    
    // Return a simplified response with the expected format
    return createSuccessResponse({
      can_create: permissionData.has_permission,
      org_id: permissionData.org_id,
      reason: permissionData.reason
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error');
  }
});
