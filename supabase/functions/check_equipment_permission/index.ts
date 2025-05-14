
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/adminClient.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, equipment_id, team_id, action } = body;
    
    console.log(`Permission check request: ${JSON.stringify(body)}`);
    
    if (!user_id) {
      console.error("Missing user_id parameter");
      return createErrorResponse("Missing required parameter: user_id");
    }

    if (!action) {
      console.error("Missing action parameter");
      return createErrorResponse("Missing action parameter: specify 'create', 'edit', or 'view'");
    }
    
    if (action !== 'create' && !equipment_id) {
      console.error("Missing equipment_id parameter for non-create action");
      return createErrorResponse("Equipment ID is required for edit, delete, and view actions");
    }
    
    // Create Supabase client with service role to bypass RLS
    const adminClient = createAdminClient();
    
    // Check if request is using service role - if so, grant automatic permission
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.includes('service_role')) {
      console.log("Service role detected, granting permission automatically");
      return createSuccessResponse({
        has_permission: true,
        reason: 'service_role'
      });
    }
    
    // For creation permission check - this is either org-level or team-level
    if (action === 'create') {
      try {
        // Get user's org ID directly
        const { data: userProfile } = await adminClient
          .from('user_profiles')
          .select('org_id')
          .eq('id', user_id)
          .maybeSingle();
        
        if (!userProfile?.org_id) {
          console.error("User has no organization");
          return createSuccessResponse({
            has_permission: false,
            reason: 'no_organization'
          });
        }
        
        // If no team_id provided, check if user has proper role in their organization
        if (!team_id) {
          console.log('Checking org-level create permission');
          
          // Check user's org role directly using security definer function
          const { data: hasRole } = await adminClient.rpc(
            'has_role',
            { 
              _user_id: user_id,
              _org_id: userProfile.org_id,
              _role: 'owner'
            }
          );
          
          // Also check for manager role
          const { data: isManager } = await adminClient.rpc(
            'has_role',
            { 
              _user_id: user_id,
              _org_id: userProfile.org_id,
              _role: 'manager'
            }
          );
          
          // Only owners and managers can create equipment
          if (hasRole || isManager) {
            console.log(`User has sufficient role in org, permission granted`);
            return createSuccessResponse({
              has_permission: true,
              role: hasRole ? 'owner' : 'manager',
              org_id: userProfile.org_id,
              reason: 'org_role'
            });
          }
          
          console.error(`User has insufficient org role`);
          return createSuccessResponse({
            has_permission: false,
            reason: 'insufficient_org_permissions'
          });
        }
        
        // Team-specific equipment creation
        console.log(`Checking team-level create permission for team: ${team_id}`);
        
        // First, verify the team exists and get its org
        const { data: teamData } = await adminClient
          .from('team')
          .select('org_id, name')
          .eq('id', team_id)
          .is('deleted_at', null)
          .single();
          
        if (!teamData) {
          console.error("Team not found or deleted");
          return createSuccessResponse({
            has_permission: false,
            reason: 'team_not_found'
          });
        }
        
        // Check if user's org matches team's org (in which case, org role applies)
        if (teamData.org_id === userProfile.org_id) {
          // For users in same org as team, check if they are owner or manager
          const { data: isOwner } = await adminClient.rpc(
            'has_role',
            { 
              _user_id: user_id,
              _org_id: userProfile.org_id,
              _role: 'owner'
            }
          );
          
          const { data: isManager } = await adminClient.rpc(
            'has_role',
            { 
              _user_id: user_id,
              _org_id: userProfile.org_id,
              _role: 'manager'
            }
          );
          
          if (isOwner || isManager) {
            console.log(`User has org-level role, permission granted`);
            return createSuccessResponse({
              has_permission: true,
              role: isOwner ? 'owner' : 'manager',
              org_id: teamData.org_id,
              reason: 'org_role',
              team_name: teamData.name
            });
          }
        }
        
        // If different org or insufficient org role, check team membership
        // Check if user is a team member and has the right role
        const { data: hasTeamManagerRole } = await adminClient.rpc(
          'has_team_role',
          {
            _user_id: user_id,
            _team_id: team_id,
            _role: 'manager'
          }
        );
        
        const { data: hasTeamOwnerRole } = await adminClient.rpc(
          'has_team_role',
          {
            _user_id: user_id,
            _team_id: team_id,
            _role: 'owner'
          }
        );
        
        if (hasTeamManagerRole || hasTeamOwnerRole) {
          console.log(`User has manager or owner role in team, permission granted`);
          return createSuccessResponse({
            has_permission: true,
            role: hasTeamOwnerRole ? 'owner' : 'manager',
            org_id: teamData.org_id,
            reason: 'team_role',
            team_name: teamData.name
          });
        }
        
        // Check if user is a team member at all
        const { data: isTeamMember } = await adminClient.rpc(
          'is_team_member',
          {
            _user_id: user_id,
            _team_id: team_id
          }
        );
        
        if (!isTeamMember) {
          console.error("User is not a team member");
          return createSuccessResponse({
            has_permission: false,
            reason: 'not_team_member'
          });
        }
        
        console.error(`User has insufficient team role`);
        return createSuccessResponse({
          has_permission: false,
          reason: 'insufficient_team_role'
        });
      } catch (error) {
        console.error('Error checking create permission:', error);
        return createErrorResponse(`Error checking permission: ${error.message}`);
      }
    }
    
    // For edit/view/delete permission checks
    if (action === 'edit' || action === 'view' || action === 'delete') {
      try {
        // Use security definer functions to check permissions
        if (action === 'view') {
          const { data: hasAccess } = await adminClient.rpc(
            'can_access_equipment',
            { 
              p_uid: user_id, 
              p_equipment_id: equipment_id 
            }
          );
          
          return createSuccessResponse({
            has_permission: !!hasAccess,
            reason: hasAccess ? 'has_access' : 'no_permission'
          });
        }
        
        if (action === 'edit' || action === 'delete') {
          const { data: canEdit } = await adminClient.rpc(
            'can_edit_equipment',
            { 
              p_uid: user_id, 
              p_equipment_id: equipment_id 
            }
          );
          
          return createSuccessResponse({
            has_permission: !!canEdit,
            reason: canEdit ? 'has_permission' : 'no_permission'
          });
        }
      } catch (error) {
        console.error('Error checking equipment access:', error);
        return createErrorResponse(`Error checking equipment access: ${error.message}`);
      }
    }
    
    // Invalid action
    console.error(`Invalid action specified: ${action}`);
    return createErrorResponse("Invalid action specified");
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
