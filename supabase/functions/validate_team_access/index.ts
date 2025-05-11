
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
    
    // First get the app_user.id for the auth user
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    if (appUserError || !appUser) {
      console.error('Error finding app_user:', appUserError || 'App user not found');
      return new Response(
        JSON.stringify({ 
          error: "User not found", 
          is_member: false,
          debug: { auth_uid: user_id, error: appUserError }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Check if the user is a member of the team
    const { data: teamMember, error: memberError } = await supabaseClient
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', team_id)
      .maybeSingle();
    
    if (memberError) {
      console.error('Error checking team membership:', memberError);
      return new Response(
        JSON.stringify({ 
          error: memberError.message, 
          is_member: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Also check if the user is an organization owner
    // First, get the team's organization ID
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
    
    // Check for organization-level roles
    const { data: orgRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)  // Using auth user ID for user_roles table
      .eq('org_id', team.org_id);
    
    if (rolesError) {
      console.error('Error checking organization roles:', rolesError);
      // Continue anyway, not a critical error
    }
    
    // Check if any roles exist and if any are 'owner' role
    const hasOrgAccess = orgRoles && orgRoles.length > 0 && 
      orgRoles.some(r => r.role === 'owner');
    
    return new Response(
      JSON.stringify({ 
        is_member: !!teamMember || hasOrgAccess,
        has_org_access: hasOrgAccess,
        team_member_id: teamMember?.id || null,
        debug: {
          app_user_id: appUser.id,
          org_id: team.org_id,
          org_roles: orgRoles || [],
          team_member: !!teamMember
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
