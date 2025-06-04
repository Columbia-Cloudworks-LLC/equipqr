
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient, getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '../_shared/supabaseAdminClient.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Authenticate the user
    const user = await getAuthenticatedUser(req);
    const adminClient = createAdminClient();

    // Get user's teams using the centralized admin client
    const { data: teams, error } = await adminClient
      .from('team')
      .select(`
        id,
        name,
        description,
        org_id,
        created_at,
        team_member!inner(
          user_id,
          team_roles(role)
        )
      `)
      .eq('team_member.user_id', user.id);

    if (error) {
      console.error('Error fetching user teams:', error);
      return createErrorResponse('Failed to fetch teams', 500);
    }

    return createSuccessResponse({ teams: teams || [] });

  } catch (error) {
    console.error('Error in get_user_teams function:', error);
    return createErrorResponse(error.message, 401);
  }
});
