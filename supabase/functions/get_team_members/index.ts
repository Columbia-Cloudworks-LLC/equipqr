
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts';

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
    
    // Create Supabase admin client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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
    
    try {
      // Call the get_team_members_with_roles database function using service role client
      const { data, error } = await supabaseClient.rpc(
        'get_team_members_with_roles', 
        { 
          _team_id: team_id
        }
      );
      
      if (error) {
        console.error('Error from get_team_members_with_roles function:', error);
        
        // If the function fails, use direct query as fallback
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('team_member')
          .select(`
            id,
            team_id,
            user_id,
            joined_at,
            app_user:user_id (
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
          name: member.app_user?.display_name || 'Unknown',
          email: member.app_user?.email || 'unknown@email.com',
          role: member.team_roles && member.team_roles.length > 0 ? 
            member.team_roles[0].role : 'viewer',
          status: 'Active',
          auth_uid: member.app_user?.auth_uid
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
