
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
    
    // Create regular Supabase client - no admin bypass needed with our security definer functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First get the team's org_id
    const { data: teamOrgId } = await supabase.rpc('get_team_org', {
      team_id_param: team_id
    });
    
    if (!teamOrgId) {
      return createErrorResponse("Team not found");
    }
    
    // Check if user is an org owner
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', teamOrgId)
      .eq('role', 'owner')
      .maybeSingle();
    
    if (userRoles) {
      return createSuccessResponse({ 
        hasPermission: true, 
        reason: 'org_role',
        role: 'owner' 
      });
    }
    
    // Check if user is a team manager/owner
    const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
      _user_id: user_id,
      _team_id: team_id
    });
    
    const managerRoles = ['manager', 'owner'];
    if (teamRole && managerRoles.includes(teamRole)) {
      return createSuccessResponse({ 
        hasPermission: true, 
        reason: 'team_role',
        role: teamRole
      });
    }
    
    // User doesn't have permission
    return createSuccessResponse({ 
      hasPermission: false, 
      reason: 'insufficient_permissions' 
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message, 500);
  }
});
