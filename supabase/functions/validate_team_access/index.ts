
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
    
    // Get app_user id for this auth user
    const { data: appUser } = await supabaseClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
      
    let teamMemberId = null;
    if (appUser?.id) {
      // Check if user is a team member (direct check)
      const { data: teamMember } = await supabaseClient
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
        
      teamMemberId = teamMember?.id || null;
    }
    
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
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: "User not found", 
          is_member: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
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
    
    // User has access if:
    // 1. They're a direct member of the team OR
    // 2. They have an org-level 'owner' role for the team's organization OR
    // 3. They're in the team's organization
    const isMember = teamMemberId !== null || hasOrgAccess || userProfile.org_id === team.org_id;
    
    return new Response(
      JSON.stringify({ 
        is_member: isMember,
        has_org_access: hasOrgAccess,
        team_member_id: teamMemberId,
        debug: {
          app_user_id: appUser?.id,
          org_id: team.org_id,
          user_org_id: userProfile.org_id,
          is_same_org: userProfile.org_id === team.org_id,
          org_roles: orgRoles || [],
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
});
