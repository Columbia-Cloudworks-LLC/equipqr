
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Inlined CORS headers instead of importing from shared module
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// This endpoint validates if the user can change a team member's role
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract params from request
    const { auth_user_id, team_id, target_user_id, role } = await req.json();
    
    if (!auth_user_id || !team_id || !target_user_id) {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'Missing required parameters' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client with admin rights to check permissions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Get team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from("team")
      .select("org_id")
      .eq("id", team_id)
      .single();
    
    if (teamError) {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'Team not found or access error' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get organization roles for both users
    const { data: authUserOrgRole, error: authOrgRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", auth_user_id)
      .eq("org_id", team.org_id)
      .maybeSingle();
      
    const { data: targetUserOrgRole, error: targetOrgRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("org_id", team.org_id)
      .maybeSingle();
    
    // Get app_user IDs for both users
    const { data: authAppUser, error: authUserError } = await supabaseAdmin
      .from("app_user")
      .select("id")
      .eq("auth_uid", auth_user_id)
      .single();
      
    const { data: targetAppUser, error: targetUserError } = await supabaseAdmin
      .from("app_user")
      .select("id")
      .eq("auth_uid", target_user_id)
      .single();
    
    if (authUserError || targetUserError || !authAppUser || !targetAppUser) {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'User not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get team member records for both users
    const { data: authTeamMember, error: authMemberError } = await supabaseAdmin
      .from("team_member")
      .select("id")
      .eq("user_id", authAppUser.id)
      .eq("team_id", team_id)
      .maybeSingle();
      
    const { data: targetTeamMember, error: targetMemberError } = await supabaseAdmin
      .from("team_member")
      .select("id")
      .eq("user_id", targetAppUser.id)
      .eq("team_id", team_id)
      .maybeSingle();
    
    // Get team roles if they exist
    let authUserTeamRole = null;
    let targetUserTeamRole = null;
    
    if (authTeamMember) {
      const { data: authRoleData } = await supabaseAdmin
        .from("team_roles")
        .select("role")
        .eq("team_member_id", authTeamMember.id)
        .maybeSingle();
      authUserTeamRole = authRoleData?.role;
    }
    
    if (targetTeamMember) {
      const { data: targetRoleData } = await supabaseAdmin
        .from("team_roles")
        .select("role")
        .eq("team_member_id", targetTeamMember.id)
        .maybeSingle();
      targetUserTeamRole = targetRoleData?.role;
    }
    
    // Implement hierarchy rules
    const authOrgRole = authUserOrgRole?.role;
    const targetOrgRole = targetUserOrgRole?.role;
    
    console.log('Permission check:', {
      authOrgRole,
      targetOrgRole,
      authUserTeamRole,
      targetUserTeamRole,
      isSelfChange: auth_user_id === target_user_id
    });
    
    // Rule 1: Self-management prevention - managers cannot change their own role
    if (auth_user_id === target_user_id && (authUserTeamRole === 'manager' || authOrgRole === 'manager')) {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'Managers cannot change their own role' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Rule 2: Organization owners can change any role
    if (authOrgRole === 'owner') {
      return new Response(
        JSON.stringify({ can_change: true, reason: 'org_owner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Rule 3: Organization managers can manage team roles BUT NOT other organization managers
    if (authOrgRole === 'manager') {
      if (targetOrgRole === 'owner') {
        return new Response(
          JSON.stringify({ 
            can_change: false, 
            reason: 'Organization managers cannot manage organization owners' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      if (targetOrgRole === 'manager') {
        return new Response(
          JSON.stringify({ 
            can_change: false, 
            reason: 'Organization managers cannot manage other organization managers - contact organization owner' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Org managers can manage team roles for non-org-managers
      return new Response(
        JSON.stringify({ can_change: true, reason: 'org_manager' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Rule 4: Team managers (who are NOT organization managers) can manage other team members
    if (authUserTeamRole === 'manager' && !authOrgRole) {
      // Cannot manage organization managers
      if (targetOrgRole === 'owner' || targetOrgRole === 'manager') {
        return new Response(
          JSON.stringify({ 
            can_change: false, 
            reason: 'Team managers cannot manage organization managers' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Can manage other team members (including requestors)
      return new Response(
        JSON.stringify({ can_change: true, reason: 'team_manager' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Default - no permission
    return new Response(
      JSON.stringify({ can_change: false, reason: 'insufficient_permissions' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing permission check:', error);
    return new Response(
      JSON.stringify({ 
        can_change: false, 
        reason: `Error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
