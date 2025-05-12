
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
    const supabase = createAdminClient();
    
    // Get the team's organization
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', team_id)
      .single();
      
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return createErrorResponse("Team not found");
    }
    
    // Check if user is an org owner for this team's organization
    const { data: orgRole } = await supabase.rpc(
      'get_user_role',
      { _user_id: user_id, _org_id: team.org_id }
    );
    
    if (orgRole === 'owner') {
      return createSuccessResponse({
        can_create: true,
        reason: 'org_owner',
        role: 'owner'
      });
    }
    
    // Check user's role in the team
    const { data: teamRole } = await supabase.rpc(
      'get_team_role',
      { _user_id: user_id, _team_id: team_id }
    );
    
    if (teamRole && ['manager', 'creator'].includes(teamRole)) {
      return createSuccessResponse({
        can_create: true,
        reason: 'team_role',
        role: teamRole
      });
    }
    
    // Check for organization_acl entries (cross-org access)
    const { data: orgAcl } = await supabase
      .from('organization_acl')
      .select('role')
      .eq('subject_id', user_id)
      .eq('subject_type', 'user')
      .eq('org_id', team.org_id)
      .or('expires_at.gt.now,expires_at.is.null')
      .maybeSingle();
    
    if (orgAcl && orgAcl.role === 'manager') {
      return createSuccessResponse({
        can_create: true,
        reason: 'cross_org_access',
        role: orgAcl.role
      });
    }
    
    // User doesn't have permission
    return createSuccessResponse({
      can_create: false,
      reason: 'insufficient_permissions'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
