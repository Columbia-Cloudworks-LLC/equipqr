
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
    
    console.log(`Attempting to repair team membership: team_id=${team_id}, user_id=${user_id}`);
    
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
          success: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Found app_user.id: ${appUser.id} for auth_uid: ${user_id}`);
    
    // Check if the team exists
    const { data: team, error: teamError } = await supabaseClient
      .from('team')
      .select('id, org_id, created_by')
      .eq('id', team_id)
      .single();
    
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return new Response(
        JSON.stringify({ 
          error: "Team not found", 
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    console.log(`Found team: ${team.id}, org_id: ${team.org_id}, created_by: ${team.created_by}`);
    
    // Check if user is already a team member
    const { data: existingMember, error: existingError } = await supabaseClient
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', team_id)
      .maybeSingle();
    
    if (existingMember) {
      console.log(`User is already a team member with id: ${existingMember.id}`);
      
      // Return success but inform that user was already a member
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "User is already a team member",
          team_member_id: existingMember.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Add user as team member
    console.log(`Adding user ${appUser.id} to team ${team_id}`);
    const { data: newMember, error: insertError } = await supabaseClient
      .from('team_member')
      .insert({
        user_id: appUser.id,
        team_id: team_id,
        joined_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error inserting team member:', insertError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to add user as team member: ${insertError.message}`, 
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log(`Successfully added user as team member with id: ${newMember.id}`);
    
    // Add manager role
    const { data: newRole, error: roleError } = await supabaseClient
      .from('team_roles')
      .insert({
        team_member_id: newMember.id,
        role: 'manager',
        assigned_at: new Date().toISOString(),
        assigned_by: appUser.id
      })
      .select('id')
      .single();
    
    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Continue anyway, at least the user is a member now
    } else {
      console.log(`Successfully assigned manager role with id: ${newRole.id}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User successfully added as team member with manager role",
        team_member_id: newMember.id,
        role_id: newRole?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
