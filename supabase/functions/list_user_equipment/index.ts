
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
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
      return createErrorResponse("Missing required parameter: user_id");
    }

    // Create Supabase client using the service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Get user's organization for determining external equipment
    let userOrgId = null;
    try {
      // Get user's organization ID
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (userProfile) {
        userOrgId = userProfile.org_id;
      }
    } catch (profileError) {
      console.error('Unexpected error fetching user profile:', profileError);
    }
    
    // If we can't determine user's org, we can't show any equipment
    if (!userOrgId) {
      return createSuccessResponse([]);
    }
    
    // Get list of teams the user belongs to
    const appUserResult = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    const appUserId = appUserResult.data?.id;
    
    // We'll build a list of team IDs the user can access
    const accessibleTeamIds: string[] = [];
    
    if (appUserId) {
      // Get teams where user is a member
      const { data: teamMemberships, error: teamError } = await adminClient
        .from('team_member')
        .select('team_id')
        .eq('user_id', appUserId);
        
      if (!teamError && teamMemberships) {
        accessibleTeamIds.push(...teamMemberships.map(tm => tm.team_id));
      }
    }
    
    // Build and execute query with correct filtering logic
    let query = adminClient
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null);
    
    // First filter condition: equipment belongs to user's organization
    query = query.or(`org_id.eq.${userOrgId}`);
    
    // Second filter condition: equipment belongs to user's teams (if any)
    if (accessibleTeamIds.length > 0) {
      const teamIdList = accessibleTeamIds.join(',');
      query = query.or(`team_id.in.(${teamIdList})`);
    }
    
    const { data: equipment, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching equipment:', error);
      return createErrorResponse(`Failed to fetch equipment: ${error.message}`);
    }
    
    // Process the equipment data to add required fields
    const processedEquipment = equipment?.map(item => {
      const isExternalOrg = item.org_id !== userOrgId;
      
      return {
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
        can_edit: !isExternalOrg || (item.team?.org_id === userOrgId)
      };
    }) || [];
    
    return createSuccessResponse(processedEquipment);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
