
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status 
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
    // Parse the request body to get parameters
    const { user_id, equipment_id, action, team_id } = await req.json();
    
    // Basic validation
    if (!user_id || (!equipment_id && action !== 'create')) {
      return createErrorResponse('Missing required parameters');
    }
    
    console.log(`Processing permission check: user_id=${user_id}, equipment_id=${equipment_id}, action=${action}, team_id=${team_id}`);
    
    // Set up Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Handle creation permission check
    if (action === 'create') {
      // Check that user_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return createErrorResponse('Invalid user_id format');
      }
      
      if (team_id && !uuidRegex.test(team_id)) {
        return createErrorResponse('Invalid team_id format');
      }
      
      // Use our improved database function through RPC
      const { data: permissionData, error: permissionError } = await supabase.rpc(
        'check_equipment_create_permission',
        { 
          p_user_id: user_id,
          p_team_id: team_id || null
        }
      );
      
      if (permissionError) {
        console.error('Error checking creation permission:', permissionError);
        return createErrorResponse(`Permission check error: ${permissionError.message}`);
      }
      
      if (!permissionData || permissionData.length === 0) {
        return createSuccessResponse({
          has_permission: false,
          reason: 'unknown_error'
        });
      }
      
      return createSuccessResponse({
        has_permission: permissionData[0].has_permission,
        org_id: permissionData[0].org_id,
        reason: permissionData[0].reason
      });
    }
    
    // For view/edit/delete actions, handle parameters carefully
    if (['view', 'edit', 'delete'].includes(action)) {
      try {
        // For permissions, use our non-recursive safe function
        const { data: hasPermission, error: permissionError } = await supabase.rpc(
          'check_equipment_permissions',
          {
            _user_id: user_id,
            _equipment_id: equipment_id,
            _action: action
          }
        );
        
        if (permissionError) {
          console.error(`Error checking ${action} permission:`, permissionError);
          return createErrorResponse(`Permission check error: ${permissionError.message}`);
        }
        
        // Get equipment details for additional info in the response
        const { data: equipment } = await supabase
          .from('equipment')
          .select('org_id, team_id')
          .eq('id', equipment_id)
          .single();
        
        return createSuccessResponse({
          has_permission: hasPermission,
          equipment_details: hasPermission ? equipment : null,
          reason: hasPermission ? 'permission_granted' : 'permission_denied'
        });
      } catch (err) {
        console.error('Error during permission check:', err);
        return createErrorResponse(`Error processing permission check: ${err.message}`);
      }
    }
    
    // Invalid action
    return createErrorResponse(`Invalid action: ${action}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
