
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createErrorResponse("Missing authorization header");
    }

    // Create Supabase client using the user's JWT token
    // This ensures RLS policies are applied correctly
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
    
    // Let RLS handle access control by using client with user's JWT
    // This relies on the "Team or org members can read equipment" policy
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null)
      .order('name');
    
    if (error) {
      console.error('Error fetching equipment:', error);
      return createErrorResponse(`Failed to fetch equipment: ${error.message}`);
    }
    
    // Get user's org ID for determining external equipment
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    const userOrgId = userProfile?.org_id;
    
    // Process the equipment data to add required fields
    const processedEquipment = equipment.map(item => {
      const isExternalOrg = item.team?.org_id && userOrgId && 
                        item.team.org_id !== userOrgId;
      
      return {
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
      };
    });
    
    return createSuccessResponse(processedEquipment);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
