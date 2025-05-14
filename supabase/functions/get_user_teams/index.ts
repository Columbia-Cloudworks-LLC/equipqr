
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

// Create a response with CORS headers
function createResponse(body: any, status = 200) {
  return new Response(
    JSON.stringify(body),
    { 
      status: status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createResponse({ error: 'Missing required parameter: user_id' }, 400);
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createResponse({ error: 'Missing authorization header' }, 401);
    }

    // Create Supabase client using the user's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    
    // Get user's profile to determine organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    const userOrgId = userProfile?.org_id;
    
    // RLS policy will automatically filter to teams the user can access
    const { data: teams, error } = await supabase
      .from('team')
      .select('id, name, org_id, organization:org_id(name)')
      .is('deleted_at', null);
    
    if (error) {
      console.error('Error fetching teams:', error);
      return createResponse({ error: error.message, teams: [] }, 500);
    }
    
    // Process the teams to add org_name and external status
    const teamsWithOrgInfo = teams.map(team => {
      const isExternalOrg = userOrgId && team.org_id && team.org_id !== userOrgId;
      
      return {
        ...team,
        org_name: team.organization?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
        access_type: 'role_based' // All access now goes through role-based checks
      };
    });
    
    return createResponse({ teams: teamsWithOrgInfo });
    
  } catch (error) {
    console.error('Error in get_user_teams function:', error);
    return createResponse({ error: error.message }, 500);
  }
});
