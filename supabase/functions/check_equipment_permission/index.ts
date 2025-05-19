
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
    
    const { user_id, equipment_id, action, team_id } = body;
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }
    
    console.log(`Processing permission check: user_id=${user_id}, equipment_id=${equipment_id || 'null'}, action=${action}, team_id=${team_id || 'null'}`);
    
    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error(`Invalid UUID format for user_id: ${user_id}`);
      return createErrorResponse("Invalid UUID format for user_id");
    }
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // For creation permission check
    if (action === 'create') {
      try {
        console.log('Checking creation permission...');
        
        // Prepare parameters
        const functionParams: Record<string, any> = {
          p_user_id: user_id,
          p_team_id: (team_id && team_id !== 'none' && team_id !== 'null') ? team_id : null
        };
        
        console.log('Calling check_equipment_create_permission with params:', functionParams);
        
        const { data: permData, error: permError } = await supabase.rpc(
          'check_equipment_create_permission', 
          functionParams
        );
        
        if (permError) {
          console.error('Error checking creation permission:', permError);
          return createErrorResponse(`Permission check failed: ${permError.message}`);
        }
        
        if (!permData || permData.length === 0) {
          console.error('No permission data returned');
          return createErrorResponse('Invalid response from permission check');
        }
        
        console.log('Permission result:', permData);
        
        return createSuccessResponse({
          has_permission: permData[0].has_permission,
          org_id: permData[0].org_id,
          reason: permData[0].reason
        });
      } catch (error) {
        console.error('Error in creation permission check:', error);
        throw error;
      }
    } 
    
    // For accessing existing equipment
    if (action === 'view' || action === 'edit') {
      if (!equipment_id) {
        return createErrorResponse("equipment_id is required for view/edit actions");
      }
      
      // For view action
      if (action === 'view') {
        console.log(`Checking view permission for equipment ${equipment_id}`);
        const { data, error } = await supabase.rpc('can_access_equipment', { 
          p_uid: user_id,
          p_equipment_id: equipment_id
        });
        
        if (error) {
          console.error('Access check error:', error);
          return createErrorResponse(`Access check failed: ${error.message}`);
        }
        
        return createSuccessResponse({ has_permission: data });
      }
      
      // For edit action
      if (action === 'edit') {
        console.log(`Checking edit permission for equipment ${equipment_id}`);
        const { data, error } = await supabase.rpc('can_edit_equipment', { 
          p_uid: user_id,
          p_equipment_id: equipment_id
        });
        
        if (error) {
          console.error('Edit permission check error:', error);
          return createErrorResponse(`Edit permission check failed: ${error.message}`);
        }
        
        return createSuccessResponse({ has_permission: data });
      }
    }
    
    // Invalid action
    return createErrorResponse(`Unsupported action: ${action}`);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error');
  }
});
