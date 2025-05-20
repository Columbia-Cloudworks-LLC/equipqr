
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined CORS headers from _shared/cors.ts
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
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      throw new Error('Function execution timed out');
    }, 8000); // 8 seconds max execution time
    
    try {
      const { user_id, equipment_id, action, team_id } = await req.json();
      
      // Log request details for debugging
      console.log(`Processing permission check: user_id=${user_id}, equipment_id=${equipment_id}, action=${action}, team_id=${team_id}`);
      
      if (!user_id) {
        return createErrorResponse("Missing required parameter: user_id");
      }
      
      // Validate UUID format for all IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (user_id && !uuidRegex.test(user_id)) {
        console.error(`Invalid UUID format for user_id: ${user_id}`);
        return createErrorResponse("Invalid user ID format");
      }
      
      if (equipment_id && !uuidRegex.test(equipment_id)) {
        console.error(`Invalid UUID format for equipment_id: ${equipment_id}`);
        return createErrorResponse("Invalid equipment ID format");
      }
      
      if (team_id && !uuidRegex.test(team_id)) {
        console.error(`Invalid UUID format for team_id: ${team_id}`);
        return createErrorResponse("Invalid team ID format");
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const supabase = createClient(
        supabaseUrl,
        supabaseServiceKey
      );

      // Log which permission check we're performing
      if (action === 'view' && equipment_id) {
        console.log(`Checking view permission for equipment ${equipment_id}`);
      } else if (action === 'edit' && equipment_id) {
        console.log(`Checking edit permission for equipment ${equipment_id}`);
      } else if (action === 'create') {
        console.log(`Checking create permission for team ${team_id || 'N/A'}`);
      }
      
      // Use our optimized RPC function with explicit UUID casting
      const { data: permissionData, error: permissionError } = await supabase.rpc(
        'rpc_check_equipment_permission',
        { 
          user_id: user_id, // UUID type is preserved correctly
          action: action,
          team_id: team_id || null,
          equipment_id: equipment_id || null
        }
      );

      if (permissionError) {
        console.error('Permission check error:', permissionError);
        return createErrorResponse(`Permission check failed: ${permissionError.message}`);
      }

      return createSuccessResponse(permissionData);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error);
    return createErrorResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
