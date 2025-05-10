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
    const { _team_id, _user_id, _role, _added_by } = await req.json();
    
    if (!_team_id || !_user_id || !_role) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exposed by default when deployed
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Check if team member already exists
    const { data: existingMember, error: checkError } = await supabaseClient
      .from('team_member')
      .select('id')
      .eq('user_id', _user_id)
      .eq('team_id', _team_id)
      .maybeSingle();
    
    if (checkError) {
      return new Response(
        JSON.stringify({ error: checkError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    let teamMemberId;
    
    // If member doesn't exist, add them
    if (!existingMember) {
      const { data: newMember, error: insertError } = await supabaseClient
        .from('team_member')
        .insert({
          team_id: _team_id,
          user_id: _user_id,
          joined_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      teamMemberId = newMember.id;
    } else {
      teamMemberId = existingMember.id;
    }
    
    // Now handle the role assignment in the team_roles table
    
    // Check if the role already exists for this team member
    const { data: existingRole, error: roleCheckError } = await supabaseClient
      .from('team_roles')
      .select('id')
      .eq('team_member_id', teamMemberId)
      .maybeSingle();
    
    if (roleCheckError) {
      return new Response(
        JSON.stringify({ error: roleCheckError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // If role exists, update it
    if (existingRole) {
      const { error: updateRoleError } = await supabaseClient
        .from('team_roles')
        .update({
          role: _role,
          assigned_by: _added_by,
          assigned_at: new Date().toISOString()
        })
        .eq('id', existingRole.id);
      
      if (updateRoleError) {
        return new Response(
          JSON.stringify({ error: updateRoleError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      // Otherwise, insert a new role
      const { error: insertRoleError } = await supabaseClient
        .from('team_roles')
        .insert({
          team_member_id: teamMemberId,
          role: _role,
          assigned_by: _added_by,
          assigned_at: new Date().toISOString()
        });
      
      if (insertRoleError) {
        return new Response(
          JSON.stringify({ error: insertRoleError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, team_member_id: teamMemberId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
