
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
    const { equipment_id, user_id } = await req.json();
    
    if (!equipment_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(equipment_id)) {
      console.error(`Invalid UUID format for equipment_id: ${equipment_id}`);
      return new Response(
        JSON.stringify({ error: "Invalid equipment ID format" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabaseClient
      .from('equipment')
      .select('org_id, team_id')
      .eq('id', equipment_id)
      .single();
    
    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return new Response(
        JSON.stringify({ error: "Equipment not found", has_access: false }),
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
        JSON.stringify({ error: "User not found", has_access: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Direct organization access
    if (userProfile.org_id === equipment.org_id) {
      return new Response(
        JSON.stringify({ 
          has_access: true,
          reason: "same_org"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // If equipment belongs to a team, check team membership
    if (equipment.team_id) {
      // Get app_user id for this auth user
      const { data: appUser } = await supabaseClient
        .from('app_user')
        .select('id')
        .eq('auth_uid', user_id)
        .maybeSingle();
      
      if (appUser?.id) {
        // Check if user is a member of the team
        const { data: teamMember } = await supabaseClient
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .maybeSingle();
          
        if (teamMember?.id) {
          return new Response(
            JSON.stringify({ 
              has_access: true,
              reason: "team_member",
              team_id: equipment.team_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
    }
    
    // Check if user has org-level access
    const { data: orgRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', equipment.org_id);
      
    if (orgRoles && orgRoles.length > 0) {
      // If user has any role in the equipment's organization, grant access
      return new Response(
        JSON.stringify({ 
          has_access: true,
          reason: "org_role"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // No access found
    return new Response(
      JSON.stringify({ 
        has_access: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        has_access: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
