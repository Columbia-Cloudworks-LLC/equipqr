
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

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      const rawBody = await req.text();
      console.log(`Raw request body: ${rawBody}`);
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
    if (!isValidUUID(user_id)) {
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
        
        // Convert team_id to proper format for the database function
        let formattedTeamId = team_id;
        if (team_id === 'null' || team_id === 'none' || team_id === '') {
          formattedTeamId = null;
        }
        
        // Validate team_id format if present
        if (formattedTeamId !== null && !isValidUUID(formattedTeamId)) {
          return createErrorResponse("Invalid UUID format for team_id");
        }
        
        console.log('Using formatted team ID:', formattedTeamId);
        
        // Call the database function with explicit parameter naming and typing
        const { data: permData, error: permError } = await supabase.rpc(
          'simplified_equipment_create_permission', 
          { 
            p_user_id: user_id,
            p_team_id: formattedTeamId
          }
        );
        
        if (permError) {
          console.error('Error checking creation permission:', permError);
          
          // Try an alternate function if the first one fails
          const { data: altData, error: altError } = await supabase.rpc(
            'check_equipment_create_permission', 
            { 
              p_user_id: user_id,
              p_team_id: formattedTeamId
            }
          );
          
          if (altError) {
            console.error('Alternate permission check also failed:', altError);
            return createErrorResponse(`Permission check failed: ${altError.message}`);
          }
          
          console.log('Alternate permission check result:', altData);
          
          if (Array.isArray(altData) && altData.length > 0) {
            return createSuccessResponse({
              has_permission: altData[0].has_permission,
              org_id: altData[0].org_id,
              reason: altData[0].reason
            });
          } else {
            return createErrorResponse('Invalid response from permission check');
          }
        }
        
        console.log('Permission result:', permData);
        
        // For the simplified function that returns JSON
        return createSuccessResponse({
          has_permission: permData.can_create || false,
          org_id: permData.org_id,
          reason: permData.reason
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
      
      // Validate equipment_id format
      if (!isValidUUID(equipment_id)) {
        return createErrorResponse("Invalid UUID format for equipment_id");
      }
      
      // For view action
      if (action === 'view') {
        console.log(`Checking view permission for equipment ${equipment_id}`);
        
        try {
          const { data, error } = await supabase.rpc('can_access_equipment', { 
            p_uid: user_id,
            p_equipment_id: equipment_id
          });
          
          if (error) {
            console.error('Access check error:', error);
            
            // Try direct query as fallback
            const { data: equipment } = await supabase
              .from('equipment')
              .select('id, org_id, team_id')
              .eq('id', equipment_id)
              .is('deleted_at', null)
              .single();
              
            if (!equipment) {
              return createErrorResponse('Equipment not found');
            }
            
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('org_id')
              .eq('id', user_id)
              .single();
              
            // Allow access if same organization
            if (userProfile && equipment && userProfile.org_id === equipment.org_id) {
              return createSuccessResponse({ has_permission: true, reason: 'same_org' });
            }
            
            return createErrorResponse('Access denied - not in same organization', 403);
          }
          
          return createSuccessResponse({ has_permission: !!data });
        } catch (viewError) {
          console.error('View permission check error:', viewError);
          return createErrorResponse(`View permission error: ${viewError.message}`);
        }
      }
      
      // For edit action
      if (action === 'edit') {
        console.log(`Checking edit permission for equipment ${equipment_id}`);
        
        try {
          const { data, error } = await supabase.rpc('can_edit_equipment', { 
            p_uid: user_id,
            p_equipment_id: equipment_id
          });
          
          if (error) {
            console.error('Edit permission check error:', error);
            
            // Try direct query as fallback approach
            const { data: equipment } = await supabase
              .from('equipment')
              .select('id, org_id, team_id')
              .eq('id', equipment_id)
              .is('deleted_at', null)
              .single();
              
            if (!equipment) {
              return createErrorResponse('Equipment not found or already deleted');
            }
            
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('org_id')
              .eq('id', user_id)
              .single();
              
            // Allow edit if same organization and has appropriate role
            if (userProfile && equipment && userProfile.org_id === equipment.org_id) {
              const { data: userRoles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user_id)
                .eq('org_id', equipment.org_id)
                .single();
                
              if (userRoles && ['owner', 'manager', 'admin'].includes(userRoles.role)) {
                return createSuccessResponse({ has_permission: true, reason: 'org_role' });
              }
            }
            
            return createErrorResponse('Edit permission denied - insufficient privileges', 403);
          }
          
          return createSuccessResponse({ has_permission: !!data });
        } catch (editError) {
          console.error('Edit permission check error:', editError);
          return createErrorResponse(`Edit permission error: ${editError.message}`);
        }
      }
    }
    
    // Invalid action
    return createErrorResponse(`Unsupported action: ${action}`);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error');
  }
});
