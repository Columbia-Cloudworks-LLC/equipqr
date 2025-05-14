
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
    
    // For creation permission check - this is either org-level or team-level
    if (action === 'create') {
      try {
        // Get user's org ID and role
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
        
        // Check if user has proper role in their organization
        const { data: userRoles } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .eq('org_id', userProfile.org_id)
          .maybeSingle();
        
        // If creating for a specific team
        if (team_id) {
          console.log(`Checking team-level create permission for team: ${team_id}`);
          
          // First, verify the team exists and get its org
          const { data: teamData } = await adminClient
            .from('team')
            .select('org_id')
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
            // For users in same org as team
            if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
              return createSuccessResponse({
                has_permission: true,
                role: userRoles.role,
                org_id: teamData.org_id,
                reason: 'org_role'
              });
            }
          }
          
          // If user is from a different org, check team role
          // First get the app_user.id that corresponds to auth user
          const { data: appUser } = await adminClient
            .from('app_user')
            .select('id')
            .eq('auth_uid', user_id)
            .maybeSingle();
            
          if (!appUser?.id) {
            console.error("Could not find app_user record for auth user");
            return createSuccessResponse({
              has_permission: false,
              reason: 'user_not_found'
            });
          }
          
          // Check team membership
          const { data: teamMember } = await adminClient
            .from('team_member')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('team_id', team_id)
            .maybeSingle();
            
          if (!teamMember?.id) {
            console.error("User is not a team member");
            return createSuccessResponse({
              has_permission: false,
              reason: 'not_team_member'
            });
          }
          
          // Check team role - need manager role to create equipment
          const { data: teamRole } = await adminClient
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .maybeSingle();
            
          if (teamRole?.role === 'manager' || teamRole?.role === 'owner') {
            console.log(`User has ${teamRole.role} role in team`);
            return createSuccessResponse({
              has_permission: true,
              role: teamRole.role,
              org_id: teamData.org_id,
              reason: 'team_role'
            });
          } else {
            console.error(`User has insufficient team role: ${teamRole?.role || 'none'}`);
            return createSuccessResponse({
              has_permission: false,
              role: teamRole?.role,
              reason: 'insufficient_team_role'
            });
          }
        } else {
          // For org-level equipment (no team)
          console.log(`Checking org-level create permission`);
          
          // Only owners and managers can create equipment
          if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
            console.log(`User has ${userRoles.role} role in org`);
            return createSuccessResponse({
              has_permission: true,
              role: userRoles.role,
              org_id: userProfile.org_id,
              reason: 'org_role'
            });
          }
          
          console.error(`User has insufficient org role: ${userRoles?.role || 'none'}`);
          return createSuccessResponse({
            has_permission: false,
            reason: 'insufficient_org_permissions'
          });
        }
      } catch (error) {
        console.error('Error checking create permission:', error);
        return createErrorResponse(`Error checking permission: ${error.message}`);
      }
    }
    
    // For edit/view permission check
    if (action === 'edit' || action === 'view' || action === 'delete') {
      try {
        // Get equipment details
        const { data: equipment, error: equipmentError } = await adminClient
          .from('equipment')
          .select('team_id, org_id')
          .eq('id', equipment_id)
          .is('deleted_at', null)
          .maybeSingle();
          
        if (equipmentError || !equipment) {
          console.error("Equipment not found or already deleted");
          return createErrorResponse("Equipment not found or already deleted");
        }
        
        // Get user's org ID
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
        
        // Check if user belongs to the equipment's org
        if (userProfile.org_id === equipment.org_id) {
          if (action === 'view') {
            // Any org member can view org equipment
            console.log("User can view equipment (same organization)");
            return createSuccessResponse({
              has_permission: true,
              reason: 'same_organization'
            });
          }
          
          // For edit/delete, check org role
          const { data: userRoles } = await adminClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user_id)
            .eq('org_id', equipment.org_id)
            .maybeSingle();
            
          if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
            console.log(`User can ${action} equipment (org ${userRoles.role})`);
            return createSuccessResponse({
              has_permission: true,
              role: userRoles.role,
              reason: 'org_role'
            });
          }
        }
        
        // If equipment is assigned to a team
        if (equipment.team_id) {
          try {
            // First get the app_user.id that corresponds to the auth user ID
            const { data: appUser } = await adminClient
              .from('app_user')
              .select('id')
              .eq('auth_uid', user_id)
              .maybeSingle();
              
            if (!appUser?.id) {
              console.error("Could not find app_user record for auth user");
              return createSuccessResponse({
                has_permission: false,
                reason: 'user_not_found'
              });
            }
            
            // Check if user is a team member
            const { data: teamMember } = await adminClient
              .from('team_member')
              .select('id')
              .eq('user_id', appUser.id)
              .eq('team_id', equipment.team_id)
              .maybeSingle();
              
            if (!teamMember?.id) {
              console.error("User is not a team member");
              return createSuccessResponse({
                has_permission: false,
                reason: 'not_team_member'
              });
            }
            
            // Get role from team_roles table
            const { data: teamRole } = await adminClient
              .from('team_roles')
              .select('role')
              .eq('team_member_id', teamMember.id)
              .maybeSingle();
              
            // For edit/delete permission on team equipment
            if (action === 'edit' || action === 'delete') {
              const canModify = teamRole?.role && ['manager', 'owner', 'admin', 'creator'].includes(teamRole.role);
              console.log(`User ${canModify ? 'can' : 'cannot'} ${action} team equipment (${teamRole?.role || 'no role'})`);
              return createSuccessResponse({
                has_permission: canModify,
                role: teamRole?.role,
                reason: teamRole ? 'team_role' : 'insufficient_permission'
              });
            }
            
            // For view permission, any team member can view
            if (action === 'view') {
              console.log("User can view equipment (team member)");
              return createSuccessResponse({
                has_permission: true,
                role: teamRole?.role,
                reason: 'team_member'
              });
            }
          } catch (error) {
            console.error('Error checking team permissions:', error);
            return createErrorResponse(`Error checking team permissions: ${error.message}`);
          }
        }
        
        // Default: no permission
        console.error("User has no permission for this equipment");
        return createSuccessResponse({
          has_permission: false,
          reason: 'no_permission'
        });
      } catch (error) {
        console.error('Error checking equipment access:', error);
        return createErrorResponse(`Error checking equipment access: ${error.message}`);
      }
    }
    
    console.error(`Invalid action specified: ${action}`);
    return createErrorResponse("Invalid action specified");
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
