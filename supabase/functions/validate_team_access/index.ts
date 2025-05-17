
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

// Helper to determine the higher role based on permission level
function getHigherRole(role1: string | null, role2: string | null): string | null {
  if (!role1) return role2;
  if (!role2) return role1;
  
  // Define role hierarchy from highest to lowest permission level
  const roleHierarchy = ['owner', 'admin', 'manager', 'creator', 'technician', 'viewer'];
  
  const role1Index = roleHierarchy.indexOf(role1);
  const role2Index = roleHierarchy.indexOf(role2);
  
  // If role isn't in our hierarchy, default to the other role
  if (role1Index === -1) return role2;
  if (role2Index === -1) return role1;
  
  // Lower index = higher permission
  return role1Index < role2Index ? role1 : role2;
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
    
    // Use our improved non-recursive function to check team access
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
    
    // Get team information for display purposes
    const { data: teamData } = await adminClient
      .from('team')
      .select('name, org_id')
      .eq('id', team_id)
      .single();
    
    if (!teamData) {
      return createErrorResponse("Team not found");
    }
    
    // Get team role from team_member and team_roles tables (direct membership)
    const { data: appUser } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    let teamRole = null;
    let teamMemberId = null;
    
    if (appUser?.id) {
      console.log(`Found app_user.id: ${appUser.id} for auth_uid: ${user_id}`);
      
      // First get team_member_id
      const { data: teamMember } = await adminClient
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      teamMemberId = teamMember?.id || null;
      
      // Then get role if team_member exists
      if (teamMember?.id) {
        console.log(`Found team_member.id: ${teamMember.id} for user_id: ${appUser.id} and team_id: ${team_id}`);
        
        const { data: roleData } = await adminClient
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .maybeSingle();
        
        teamRole = roleData?.role || null;
        console.log(`Found team_role: ${teamRole} for team_member_id: ${teamMember.id}`);
      }
    }
    
    // Check org-level role that might give higher permissions
    const { data: orgRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', teamData.org_id)
      .maybeSingle();
    
    const orgRole = orgRoleData?.role || null;
    console.log(`Found organization role: ${orgRole} for user_id: ${user_id} in org_id: ${teamData.org_id}`);
    
    // Get the effective role (higher permission between team and org roles)
    const effectiveRole = getHigherRole(teamRole, orgRole);
    console.log(`Determined effective role: ${effectiveRole} (team role: ${teamRole}, org role: ${orgRole})`);
    
    // Get the creator of the team to see if they're the creator
    const { data: teamCreator } = await adminClient
      .from('team')
      .select('created_by')
      .eq('id', team_id)
      .single();
    
    // If the user is the team creator and they don't have a role, assign manager
    let finalRole = effectiveRole;
    if (teamCreator && teamCreator.created_by === user_id && !finalRole) {
      finalRole = 'manager';
      console.log(`User ${user_id} is the team creator, assigning manager role`);
    }
    
    // Determine organization context
    let orgName = null;
    const { data: orgData } = await adminClient
      .from('organization')
      .select('name')
      .eq('id', teamData.org_id)
      .single();
      
    if (orgData) {
      orgName = orgData.name;
    }
    
    // Check if user is in same org
    let hasOrgAccess = false;
    let hasCrossOrgAccess = false;
    
    const { data: userProfile } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (userProfile && userProfile.org_id === teamData.org_id) {
      hasOrgAccess = true;
    } else if (teamRole) {
      // If user has a role but isn't in the same org, they have cross-org access
      hasCrossOrgAccess = true;
    }
    
    // Determine the access reason
    let accessReason = 'none';
    if (teamRole) {
      accessReason = 'team_member';
    } else if (orgRole && hasOrgAccess) {
      accessReason = 'org_role';
    } else if (hasOrgAccess) {
      accessReason = 'same_org';
    } else if (hasCrossOrgAccess) {
      accessReason = 'cross_org_access';
    }
    
    // Log for debugging
    console.log('Final role determination:', {
      teamRole,
      orgRole,
      effectiveRole: finalRole,
      accessReason,
      isCreator: teamCreator?.created_by === user_id
    });
    
    return createSuccessResponse({
      is_member: true,
      has_org_access: hasOrgAccess,
      has_cross_org_access: hasCrossOrgAccess,
      team_member_id: teamMemberId,
      access_reason: accessReason,
      role: finalRole || null, // Don't default to viewer anymore, use null if no role found
      team: {
        name: teamData.name,
        org_id: teamData.org_id
      },
      org_name: orgName
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
