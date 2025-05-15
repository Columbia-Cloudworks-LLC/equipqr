
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined from _shared/cors.ts
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
    // Extract request data
    const body = await req.json();
    const { team_id, user_id } = body;
    
    if (!team_id || !user_id) {
      return createErrorResponse("Missing required parameters: team_id and user_id must be provided");
    }
    
    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Use our improved function to check user's permission for the team
    const { data: hasPermission, error: permissionError } = await supabase.rpc(
      'check_user_team_permission',
      {
        _user_id: user_id,
        _team_id: team_id,
        _required_roles: ['manager', 'owner', 'admin']
      }
    );
    
    if (permissionError) {
      console.error('Error checking team role permission:', permissionError);
      return createErrorResponse(`Permission check error: ${permissionError.message}`);
    }
    
    // Get the user's role for additional information
    const { data: userRole } = await supabase.rpc(
      'get_team_role_safe',
      {
        _user_id: user_id,
        _team_id: team_id
      }
    );
    
    return createSuccessResponse({ 
      hasPermission: hasPermission === true,
      role: userRole,
      reason: hasPermission ? 'permission_granted' : 'insufficient_permissions'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message, 500);
  }
});
