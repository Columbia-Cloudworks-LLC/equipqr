
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  checkTeamAccess,
  corsHeaders,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/permissions.ts';

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
    
    console.log(`Processing access check for team ${team_id} by user ${user_id}`);
    
    // Create Supabase client
    const supabase = await createAdminClient();
    
    // Check team access using the shared function
    const accessResult = await checkTeamAccess(supabase, user_id, team_id);
    
    console.log('Team access check result:', accessResult);
    
    // Get app_user id for this auth user (for compatibility with existing code)
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    // Check direct team membership for backward compatibility
    let teamMemberId = null;
    if (appUser?.id) {
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      teamMemberId = teamMember?.id || null;
    }
    
    // Get team information for display purposes
    let team = null;
    let orgName = null;
    
    if (accessResult.hasAccess) {
      const { data: teamData } = await supabase
        .from('team')
        .select('name, org_id')
        .eq('id', team_id)
        .single();
        
      if (teamData) {
        team = { 
          name: teamData.name,
          org_id: teamData.org_id 
        };
        
        // Get organization name
        const { data: orgData } = await supabase
          .from('organization')
          .select('name')
          .eq('id', teamData.org_id)
          .single();
          
        if (orgData) {
          orgName = orgData.name;
        }
      }
    }
    
    return createSuccessResponse({
      is_member: accessResult.hasAccess,
      has_org_access: accessResult.reason === 'org_owner' || accessResult.reason === 'same_org',
      has_cross_org_access: accessResult.reason === 'cross_org_access',
      team_member_id: teamMemberId,
      access_reason: accessResult.reason,
      role: accessResult.role,
      team: team,
      org_name: orgName,
      debug: {
        ...accessResult.details,
        app_user_id: appUser?.id
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
