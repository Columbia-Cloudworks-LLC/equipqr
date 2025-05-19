
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
    // Extract request data with explicit type checking
    const body = await req.json();
    const { user_id, team_id } = body;
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }
    
    console.log(`Processing permission check for user_id=${user_id}, team_id=${team_id || 'none'}`);
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use check_equipment_create_permission instead of simplified_equipment_create_permission
    const { data, error } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: user_id,
        p_team_id: team_id || null
      }
    );
    
    if (error) {
      console.error('Database function error:', error);
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
