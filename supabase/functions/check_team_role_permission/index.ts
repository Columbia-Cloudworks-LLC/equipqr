
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

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
    
    // Get the app_user.id for the auth user and target user
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
    
    // Get the team member records for both users
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
    
    if (targetMemberError || !targetTeamMember) {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'Target user is not a team member' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the auth user's team role if they're a team member
    let authUserTeamRole = null;
    if (authTeamMember) {
      const { data: authRoleData, error: authRoleError } = await supabaseAdmin
        .from("team_roles")
        .select("role")
        .eq("team_member_id", authTeamMember.id)
        .maybeSingle();
        
      if (!authRoleError && authRoleData) {
        authUserTeamRole = authRoleData.role;
      }
    }
    
    // Get the auth user's org role
    const { data: authOrgRole, error: authOrgRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", auth_user_id)
      .eq("org_id", team.org_id)
      .maybeSingle();
    
    // Get the target member's current role
    const { data: targetRoleData, error: targetRoleError } = await supabaseAdmin
      .from("team_roles")
      .select("role")
      .eq("team_member_id", targetTeamMember.id)
      .maybeSingle();
      
    const targetCurrentRole = targetRoleData?.role;
    
    // Self-demotion check - prevent managers from changing their own role
    if (auth_user_id === target_user_id && authUserTeamRole === 'manager') {
      return new Response(
        JSON.stringify({ 
          can_change: false, 
          reason: 'Team managers cannot change their own role' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Organization owners can change any role
    if (authOrgRole?.role === 'owner') {
      return new Response(
        JSON.stringify({ can_change: true, reason: 'org_owner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Team managers can change roles of other team members (except themselves)
    if (authUserTeamRole === 'manager') {
      return new Response(
        JSON.stringify({ can_change: true, reason: 'team_manager' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Organization managers can change team roles
    if (authOrgRole?.role === 'manager') {
      return new Response(
        JSON.stringify({ can_change: true, reason: 'org_manager' }),
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
