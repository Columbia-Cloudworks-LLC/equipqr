
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
    
    try {
      // Call the function with an explicit cast of team_id to UUID in SQL
      const { data, error } = await supabaseClient.rpc(
        'get_team_members_with_roles', 
        { _team_id: team_id }
      );
      
      if (error) {
        console.error('Error from get_team_members_with_roles function:', error);
        
        // Try a direct query as a fallback if the function fails
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('team_member')
          .select(`
            id,
            team_id,
            user_id,
            joined_at,
            app_user!inner (
              id,
              display_name,
              email,
              auth_uid
            ),
            team_roles (
              role
            )
          `)
          .eq('team_id', team_id);
          
        if (fallbackError || !fallbackData) {
          console.error('Fallback query also failed:', fallbackError);
          return new Response(
            JSON.stringify({ 
              error: "Failed to retrieve team members",
              details: error.message,
              code: error.code,
              fallbackError: fallbackError?.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Transform the fallback data to match the expected format
        const transformedData = fallbackData.map(member => ({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          joined_at: member.joined_at,
          name: member.app_user.display_name || 'Unknown',
          email: member.app_user.email,
          role: member.team_roles && member.team_roles.length > 0 ? 
            member.team_roles[0].role : 'viewer',
          status: 'Active', // We can't easily determine this in the fallback
          auth_uid: member.app_user.auth_uid // Include auth_uid for easier identification
        }));
        
        console.log('Used fallback query, found members:', transformedData.length);
        return new Response(
          JSON.stringify(transformedData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
