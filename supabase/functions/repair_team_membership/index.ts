
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Inlined from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

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
          success: false,
          details: appUserError?.message || "No app_user record found for this auth user"
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
          success: false,
          details: teamError.message 
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
      
      // Check if user has a role assigned
      const { data: existingRole, error: roleCheckError } = await supabaseClient
        .from('team_roles')
        .select('id, role')
        .eq('team_member_id', existingMember.id)
        .maybeSingle();
        
      if (roleCheckError) {
        console.error('Error checking existing role:', roleCheckError);
      }
      
      if (!existingRole) {
        console.log('User is a team member but has no role assigned. Adding manager role.');
        
        // Add manager role if missing - IMPORTANT: Use user_id (auth.uid) not app_user.id for assigned_by
        const { data: newRole, error: roleError } = await supabaseClient
          .from('team_roles')
          .insert({
            team_member_id: existingMember.id,
            role: 'manager',
            assigned_at: new Date().toISOString(),
            assigned_by: user_id  // Use auth.uid instead of app_user.id to avoid foreign key constraint
          })
          .select('id')
          .single();
          
        if (roleError) {
          console.error('Error assigning role:', roleError);
          return new Response(
            JSON.stringify({ 
              error: `Failed to assign role: ${roleError.message}`,
              success: false,
              partial: true,
              team_member_id: existingMember.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Role has been assigned for the existing team member",
            team_member_id: existingMember.id,
            role_id: newRole.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Return success but inform that user was already a member
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "User is already a team member with role: " + (existingRole?.role || 'unknown'),
          team_member_id: existingMember.id,
          role_id: existingRole?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Add user as team member
    console.log(`Adding user ${appUser.id} to team ${team_id}`);
    let newMember;
    try {
      const { data, error: insertError } = await supabaseClient
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
      
      newMember = data;
      console.log(`Successfully added user as team member with id: ${newMember.id}`);
    } catch (insertError) {
      console.error('Exception adding team member:', insertError);
      return new Response(
        JSON.stringify({ 
          error: `Exception adding team member: ${insertError.message}`, 
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Add manager role - IMPORTANT: Use user_id (auth.uid) not app_user.id for assigned_by
    let newRole;
    try {
      const { data, error: roleError } = await supabaseClient
        .from('team_roles')
        .insert({
          team_member_id: newMember.id,
          role: 'manager',
          assigned_at: new Date().toISOString(),
          assigned_by: user_id  // Use auth.uid instead of app_user.id to avoid foreign key constraint
        })
        .select('id')
        .single();
      
      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Don't return early, continue and return partial success
        return new Response(
          JSON.stringify({ 
            error: `Failed to assign role: ${roleError.message}`,
            success: false,
            partial: true,
            team_member_id: newMember.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      newRole = data;
      console.log(`Successfully assigned manager role with id: ${newRole.id}`);
    } catch (roleError) {
      console.error('Exception assigning role:', roleError);
      return new Response(
        JSON.stringify({ 
          error: `Exception assigning role: ${roleError.message}`,
          success: false,
          partial: true,
          team_member_id: newMember.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Verify everything was created correctly
    try {
      const { data: verification, error: verifyError } = await supabaseClient
        .from('team_member')
        .select(`
          id,
          team_roles (
            id,
            role
          )
        `)
        .eq('id', newMember.id)
        .single();
        
      if (verifyError || !verification) {
        console.error('Error verifying team member creation:', verifyError);
        return new Response(
          JSON.stringify({ 
            success: true,
            warning: "Created but verification failed",
            team_member_id: newMember.id,
            role_id: newRole?.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      const hasRole = verification.team_roles && verification.team_roles.length > 0;
      console.log(`Verification complete. Member exists with ${hasRole ? 'role' : 'NO role'}`);
      
      if (!hasRole) {
        console.warn('Role was not properly assigned, attempting one more time');
        
        // Try one more time to add the role - using auth.uid
        const { data: retryRole, error: retryError } = await supabaseClient
          .from('team_roles')
          .insert({
            team_member_id: newMember.id,
            role: 'manager',
            assigned_at: new Date().toISOString(),
            assigned_by: user_id  // Use auth.uid instead of app_user.id
          })
          .select('id')
          .single();
          
        if (retryError) {
          console.error('Error in retry role assignment:', retryError);
        } else {
          console.log(`Successfully assigned role in retry with id: ${retryRole.id}`);
          newRole = retryRole;
        }
      }
    } catch (verifyError) {
      console.error('Exception during verification:', verifyError);
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
