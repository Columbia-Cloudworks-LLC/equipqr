
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { team_id, user_id } = await req.json();
    
    if (!team_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return new Response(
        JSON.stringify({ error: "Invalid team ID format" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Use our new check_team_access function
    const { data: accessResult, error: accessError } = await supabaseClient.rpc(
      'check_team_access',
      { 
        user_id: user_id,
        team_id: team_id
      }
    );
    
    if (accessError) {
      console.error('Error checking team access:', accessError);
      return new Response(
        JSON.stringify({ 
          error: accessError.message, 
          is_member: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get app_user id for additional context
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    // Get the team's organization ID for context
    const { data: team, error: teamError } = await supabaseClient
      .from('team')
      .select('org_id')
      .eq('id', team_id)
      .single();
    
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return new Response(
        JSON.stringify({ 
          error: "Team not found", 
          is_member: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get specific team membership info if it exists
    let teamMemberId = null;
    if (appUser?.id) {
      const { data: membership } = await supabaseClient
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      teamMemberId = membership?.id || null;
    }
    
    // Check for organization-level roles
    const { data: orgRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', team.org_id);
    
    // Check if any roles exist and if any are 'owner' role
    const hasOrgAccess = orgRoles && orgRoles.length > 0 && 
      orgRoles.some(r => r.role === 'owner');
    
    return new Response(
      JSON.stringify({ 
        is_member: accessResult === true,
        has_org_access: hasOrgAccess,
        team_member_id: teamMemberId,
        debug: {
          app_user_id: appUser?.id,
          org_id: team.org_id,
          org_roles: orgRoles || [],
          access_check_result: accessResult
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        is_member: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
