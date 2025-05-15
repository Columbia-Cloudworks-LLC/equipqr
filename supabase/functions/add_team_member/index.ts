
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Inline the CORS headers and functions from _shared/cors.ts
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
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const { _team_id, _user_id, _role, _added_by } = await req.json();
    
    if (!_team_id || !_user_id || !_role) {
      return createErrorResponse("Missing required parameters", 400);
    }
    
    // Validate UUID format for team_id and user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(_team_id)) {
      console.error(`Invalid UUID format for team_id: ${_team_id}`);
      return createErrorResponse("Invalid team ID format", 400);
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exposed by default when deployed
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // First check if the team exists
    const { data: team, error: teamError } = await supabaseClient
      .from('team')
      .select('id')
      .eq('id', _team_id)
      .is('deleted_at', null)
      .single();
    
    if (teamError) {
      console.error('Error finding team:', teamError);
      return createErrorResponse("Team not found", 404);
    }
    
    console.log(`Getting app_user for auth_uid: ${_user_id}`);
    // First, get the app_user.id that corresponds to the auth user ID
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', _user_id)
      .maybeSingle();
    
    if (appUserError) {
      console.error('Error finding app_user record:', appUserError);
      return createErrorResponse("Failed to find app_user record for the provided user ID", 404);
    }
    
    if (!appUser) {
      console.error('App user not found for auth_uid:', _user_id);
      return createErrorResponse("User record not found. The user might need to complete registration first.", 404);
    }
    
    console.log(`Found app_user.id: ${appUser.id} for auth_uid: ${_user_id}`);
    
    // Now use the app_user.id for team_member operations
    // Check if team member already exists
    const { data: existingMember, error: checkError } = await supabaseClient
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id) // Use app_user.id
      .eq('team_id', _team_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing team member:', checkError);
      return createErrorResponse(checkError.message, 500);
    }
    
    let teamMemberId;
    
    // If member doesn't exist, add them
    if (!existingMember) {
      console.log(`Adding new team member for user ${appUser.id} to team ${_team_id}`);
      const { data: newMember, error: insertError } = await supabaseClient
        .from('team_member')
        .insert({
          team_id: _team_id,
          user_id: appUser.id, // Use app_user.id
          joined_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error adding member to team:', insertError);
        return createErrorResponse(insertError.message, 500);
      }
      
      teamMemberId = newMember.id;
      console.log(`Created new team_member with id: ${teamMemberId}`);
    } else {
      teamMemberId = existingMember.id;
      console.log(`Found existing team_member with id: ${teamMemberId}`);
    }
    
    // Now handle the role assignment in the team_roles table
    
    // Check if the role already exists for this team member
    const { data: existingRole, error: roleCheckError } = await supabaseClient
      .from('team_roles')
      .select('id')
      .eq('team_member_id', teamMemberId)
      .maybeSingle();
    
    if (roleCheckError) {
      console.error('Error checking existing role:', roleCheckError);
      return createErrorResponse(roleCheckError.message, 500);
    }
    
    // IMPORTANT: We use _added_by directly as auth.uid, NOT app_user.id
    // This is because team_roles.assigned_by references auth.users(id)
    
    // If role exists, update it
    if (existingRole) {
      console.log(`Updating existing role to ${_role} for team_member ${teamMemberId}`);
      const { error: updateRoleError } = await supabaseClient
        .from('team_roles')
        .update({
          role: _role,
          assigned_by: _added_by,  // Use auth.uid directly
          assigned_at: new Date().toISOString()
        })
        .eq('id', existingRole.id);
      
      if (updateRoleError) {
        console.error('Error updating role:', updateRoleError);
        return createErrorResponse(updateRoleError.message, 500);
      }
    } else {
      // Otherwise, insert a new role
      console.log(`Assigning new role ${_role} to team_member ${teamMemberId}`);
      const { error: insertRoleError } = await supabaseClient
        .from('team_roles')
        .insert({
          team_member_id: teamMemberId,
          role: _role,
          assigned_by: _added_by,  // Use auth.uid directly
          assigned_at: new Date().toISOString()
        });
      
      if (insertRoleError) {
        console.error('Error inserting role:', insertRoleError);
        return createErrorResponse(insertRoleError.message, 500);
      }
    }
    
    // Verify the role was actually created
    const { data: verifyRole, error: verifyError } = await supabaseClient
      .from('team_roles')
      .select('id, role')
      .eq('team_member_id', teamMemberId)
      .maybeSingle();
      
    if (verifyError || !verifyRole) {
      console.error('Error verifying role creation:', verifyError || 'No role found');
      return createSuccessResponse({ 
        warning: "Team member was created but role verification failed",
        team_member_id: teamMemberId,
        success: true
      });
    }
    
    return createSuccessResponse({ 
      success: true, 
      team_member_id: teamMemberId,
      role_id: verifyRole.id,
      role: verifyRole.role
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message, 400);
  }
})
