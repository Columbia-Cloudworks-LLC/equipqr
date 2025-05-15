
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status 
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
    const { team_id, user_id } = await req.json();
    
    if (!team_id || !user_id) {
      return createErrorResponse("Missing required parameters: team_id and user_id must be provided");
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return createErrorResponse("Invalid team ID format");
    }
    
    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Use our non-recursive function to check team access
    const { data: canAccess, error: accessError } = await adminClient.rpc('check_team_access_nonrecursive', {
      p_user_id: user_id,
      p_team_id: team_id
    });
    
    if (accessError) {
      console.error('Error checking team access:', accessError);
      return createErrorResponse(accessError.message);
    }
    
    if (!canAccess) {
      return createSuccessResponse({
        is_member: false,
        access_reason: 'no_permission'
      });
    }
    
    // User has access, get additional details using service role to bypass RLS
    
    // Get team role safely using our non-recursive function
    const { data: roleData } = await adminClient.rpc('get_team_role_safe', {
      _user_id: user_id,
      _team_id: team_id
    });
    
    // Get team information for display purposes
    const { data: teamData } = await adminClient
      .from('team')
      .select('name, org_id')
      .eq('id', team_id)
      .single();
    
    let orgName = null;
    if (teamData) {
      // Get organization name
      const { data: orgData } = await adminClient
        .from('organization')
        .select('name')
        .eq('id', teamData.org_id)
        .single();
        
      if (orgData) {
        orgName = orgData.name;
      }
    }
    
    // Check if user is in same org
    let hasOrgAccess = false;
    let hasCrossOrgAccess = false;
    
    if (teamData) {
      const { data: userProfile } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      if (userProfile && userProfile.org_id === teamData.org_id) {
        hasOrgAccess = true;
      } else if (roleData) {
        // If user has a role but isn't in the same org, they have cross-org access
        hasCrossOrgAccess = true;
      }
    }
    
    // Get app_user.id for team_member join
    const { data: appUser } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    // Get team_member_id if exists
    let teamMemberId = null;
    if (appUser?.id) {
      const { data: teamMember } = await adminClient
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      teamMemberId = teamMember?.id || null;
    }
    
    // Determine the user's membership status and role
    const isMember = roleData !== null || hasOrgAccess;
    let accessReason = 'none';
    
    if (roleData) {
      accessReason = 'team_member';
    } else if (hasOrgAccess) {
      accessReason = 'same_org';
    } else if (hasCrossOrgAccess) {
      accessReason = 'cross_org_access';
    }
    
    return createSuccessResponse({
      is_member: isMember,
      has_org_access: hasOrgAccess,
      has_cross_org_access: hasCrossOrgAccess,
      team_member_id: teamMemberId,
      access_reason: accessReason,
      role: roleData || null,
      team: teamData ? {
        name: teamData.name,
        org_id: teamData.org_id
      } : null,
      org_name: orgName
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
