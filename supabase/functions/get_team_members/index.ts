
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
    const { team_id } = await req.json();
    
    if (!team_id) {
      console.error('Missing team_id parameter');
      return new Response(
        JSON.stringify({ error: "Team ID is required" }),
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
    
    console.log(`Fetching team members for team: ${team_id}`);
    
    // Create Supabase client
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exposed by default when deployed
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // First, check if the team exists
    const { data: team, error: teamError } = await supabaseClient
      .from('team')
      .select('id')
      .eq('id', team_id)
      .is('deleted_at', null)
      .single();
    
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return new Response(
        JSON.stringify({ 
          error: "Team not found", 
          details: teamError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get the user ID from the JWT
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode the token to get the user ID
        const { data: { user }, error: tokenError } = await supabaseClient.auth.getUser(token);
        
        if (tokenError || !user) {
          console.error('Error getting user from token:', tokenError);
          return new Response(
            JSON.stringify({ 
              error: "Authentication error",
              details: tokenError?.message || "Invalid token"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        userId = user.id;
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
      }
    }
    
    // Optional: Check if the user is a member of the organization or has access to this team
    // This can be implemented based on your access control requirements
    
    try {
      // Call the function passing team_id directly as UUID (no type conversion needed)
      const { data, error } = await supabaseClient.rpc(
        'get_team_members_with_roles', 
        { _team_id: team_id }
      );
      
      if (error) {
        console.error('Error from get_team_members_with_roles function:', error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to retrieve team members",
            details: error.message,
            code: error.code
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      const memberCount = data?.length || 0;
      console.log(`Found ${memberCount} team members`);
      
      return new Response(
        JSON.stringify(data || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (functionError) {
      console.error('Error calling get_team_members_with_roles:', functionError);
      return new Response(
        JSON.stringify({ 
          error: "Database function error",
          details: functionError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in get_team_members function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
