
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
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
    const { user_id, team_id } = await req.json();
    
    if (!user_id || !team_id) {
      return createErrorResponse("Missing required parameters: user_id and team_id must be provided");
    }

    // Create Supabase client
    const supabase = await createAdminClient();
    
    // Get the team's organization in a way that avoids recursion
    // Direct query to avoid RLS recursion
    const { data: teamData, error: teamError } = await supabase.rpc(
      'get_team_org',
      { team_id_param: team_id }
    );
    
    if (teamError || !teamData) {
      console.error('Error fetching team organization:', teamError || 'No data returned');
      return createErrorResponse("Could not determine team organization");
    }
    
    const team_org_id = teamData;
    console.log(`Team ${team_id} belongs to organization ${team_org_id}`);
    
    // Check if user is an org owner for this team's organization
    const { data: orgRole } = await supabase.rpc(
      'get_user_role',
      { _user_id: user_id, _org_id: team_org_id }
    );
    
    if (orgRole === 'owner') {
      return createSuccessResponse({
        can_create: true,
        reason: 'org_owner',
        role: 'owner',
        org_id: team_org_id
      });
    }
    
    // Check user's role in the team using a safer function that avoids recursion
    const { data: teamRole } = await supabase.rpc(
      'get_team_role_safe',
      { _user_id: user_id, _team_id: team_id }
    );
    
    if (teamRole && ['manager', 'creator'].includes(teamRole)) {
      return createSuccessResponse({
        can_create: true,
        reason: 'team_role',
        role: teamRole,
        org_id: team_org_id
      });
    }
    
    // Check for organization_acl entries (cross-org access)
    const { data: orgAcl } = await supabase
      .from('organization_acl')
      .select('role')
      .eq('subject_id', user_id)
      .eq('subject_type', 'user')
      .eq('org_id', team_org_id)
      .or('expires_at.gt.now,expires_at.is.null')
      .maybeSingle();
    
    if (orgAcl && orgAcl.role === 'manager') {
      return createSuccessResponse({
        can_create: true,
        reason: 'cross_org_access',
        role: orgAcl.role,
        org_id: team_org_id
      });
    }
    
    // User doesn't have permission
    return createSuccessResponse({
      can_create: false,
      reason: 'insufficient_permissions',
      org_id: team_org_id
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
