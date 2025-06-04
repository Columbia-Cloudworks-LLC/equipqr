
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

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const teamId = url.searchParams.get('team_id');

    // Build query
    let query = adminClient
      .from('equipment')
      .select(`
        id,
        name,
        manufacturer,
        model,
        serial_number,
        asset_id,
        status,
        location,
        install_date,
        warranty_expiration,
        notes,
        org_id,
        team_id,
        created_at,
        updated_at
      `)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add team filter if specified
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: equipment, error } = await query;

    if (error) {
      console.error('Error fetching equipment:', error);
      return createErrorResponse('Failed to fetch equipment', 500);
    }

    return createSuccessResponse({ 
      equipment: equipment || [],
      pagination: {
        limit,
        offset,
        count: equipment?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in list_user_equipment function:', error);
    return createErrorResponse(error.message, 401);
  }
});
