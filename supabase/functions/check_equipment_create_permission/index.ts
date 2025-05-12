
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  corsHeaders,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/index.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { team_id, user_id } = await req.json();
    
    if (!team_id || !user_id) {
      return createErrorResponse("Missing required parameters: team_id and user_id");
    }

    // Create Supabase admin client to bypass RLS
    const supabase = await createAdminClient();
    
    // First, get the team's organization ID using our safe helper function
    const { data: teamData } = await supabase.rpc('get_team_org', { team_id_param: team_id });
    
    if (!teamData) {
      return createErrorResponse("Team not found");
    }
    
    const teamOrgId = teamData;
    
    // Get user's organization ID
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    if (userProfileError) {
      console.error('Error fetching user profile:', userProfileError);
      return createErrorResponse("User profile not found");
    }
    
    // Check if user has an org-level role that allows equipment creation
    const { data: userRole } = await supabase.rpc('get_user_role', { 
      _user_id: user_id,
      _org_id: teamOrgId
    });
    
    const orgRolesWithAccess = ['owner', 'admin'];
    if (userRole && orgRolesWithAccess.includes(userRole)) {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'org_role',
        org_id: teamOrgId,
        role: userRole
      });
    }
    
    // If user is not an org admin/owner, check team membership
    // First get the app_user ID from auth user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    if (appUserError) {
      console.error('Error fetching app_user:', appUserError);
      return createErrorResponse("App user not found");
    }
    
    // Check if user is a team member with appropriate role using our safe helper function
    const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
      _user_id: user_id,
      _team_id: team_id
    });
    
    const teamRolesWithAccess = ['manager', 'owner'];
    if (teamRole && teamRolesWithAccess.includes(teamRole)) {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'team_role',
        org_id: teamOrgId,
        role: teamRole
      });
    }
    
    // If the user's org matches the team's org, they may have default access
    if (userProfile.org_id === teamOrgId) {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'same_org',
        org_id: teamOrgId,
        role: 'member'
      });
    }
    
    // User does not have permission
    return createSuccessResponse({ 
      can_create: false, 
      reason: 'insufficient_permissions',
      org_id: teamOrgId
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
