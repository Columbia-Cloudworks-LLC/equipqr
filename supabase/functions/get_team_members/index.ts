
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
    
    // Create Supabase client
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exposed by default when deployed
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Query to get team members with user details
    const { data, error } = await supabaseClient
      .from('team_member')
      .select(`
        id, 
        team_id,
        user_id,
        joined_at,
        user_profiles!inner (
          display_name,
          avatar_url
        ),
        app_user!inner (
          email
        )
      `)
      .eq('team_id', team_id);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        },
      );
    }
    
    // Format the response
    const members = data.map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      joined_at: member.joined_at,
      name: member.user_profiles.display_name,
      email: member.app_user.email,
      role: 'member', // You would get this from a team_roles table in a real implementation
      status: 'Active'
    }));
    
    return new Response(
      JSON.stringify(members),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      },
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      },
    );
  }
})
