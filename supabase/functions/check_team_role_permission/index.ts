
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract request data
    const body = await req.json();
    const { team_id, user_id } = body;
    
    if (!team_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: team_id and user_id must be provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get team details to find the team owner
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('created_by, org_id')
      .eq('id', team_id)
      .single();
    
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch team details: ${teamError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Check if the user is the team creator
    if (team.created_by === user_id) {
      return new Response(
        JSON.stringify({ hasPermission: true, reason: 'User is the team creator' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user has an owner or manager role in the organization
    const { data: orgRole, error: orgRoleError } = await supabase.rpc(
      'get_user_role',
      { _user_id: user_id, _org_id: team.org_id }
    );
    
    if (orgRole === 'owner') {
      return new Response(
        JSON.stringify({ hasPermission: true, reason: 'User is the organization owner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user has manager role in the team
    const { data: teamRole, error: teamRoleError } = await supabase.rpc(
      'get_team_role',
      { _user_id: user_id, _team_id: team_id }
    );
    
    if (teamRole === 'manager') {
      return new Response(
        JSON.stringify({ hasPermission: true, reason: 'User is a team manager' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If we've reached here, the user doesn't have permission
    return new Response(
      JSON.stringify({ hasPermission: false, reason: 'User does not have sufficient privileges' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
