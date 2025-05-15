
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
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
    // Parse the request body to get parameters
    const { user_id, equipment_id, action, team_id } = await req.json();
    
    // Basic validation
    if (!user_id || (!equipment_id && action !== 'create')) {
      return createErrorResponse('Missing required parameters');
    }
    
    console.log(`Processing permission check: user_id=${user_id}, equipment_id=${equipment_id}, action=${action}, team_id=${team_id}`);
    
    // Set up Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Handle creation permission check
    if (action === 'create') {
      // Check that user_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return createErrorResponse('Invalid user_id format');
      }
      
      if (team_id && !uuidRegex.test(team_id)) {
        return createErrorResponse('Invalid team_id format');
      }
      
      // Use our database function through RPC with explicit type casting
      const { data: permissionData, error: permissionError } = await supabase.rpc(
        'check_equipment_create_permission',
        { 
          p_user_id: user_id,
          p_team_id: team_id || null
        }
      );
      
      if (permissionError) {
        console.error('Error checking creation permission:', permissionError);
        return createErrorResponse(`Permission check error: ${permissionError.message}`);
      }
      
      if (!permissionData || permissionData.length === 0) {
        return createSuccessResponse({
          has_permission: false,
          reason: 'unknown_error'
        });
      }
      
      return createSuccessResponse({
        has_permission: permissionData[0].has_permission,
        org_id: permissionData[0].org_id,
        reason: permissionData[0].reason
      });
    }
    
    // For view/edit/delete actions, we need a different approach
    if (['view', 'edit', 'delete'].includes(action)) {
      try {
        // Get equipment details first to determine permissions approach
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipment')
          .select('org_id, team_id')
          .eq('id', equipment_id)
          .is('deleted_at', null)
          .single();
          
        if (equipmentError) {
          console.error('Error fetching equipment:', equipmentError);
          return createErrorResponse(`Failed to fetch equipment: ${equipmentError.message}`);
        }
        
        if (!equipment) {
          return createSuccessResponse({
            has_permission: false,
            reason: 'equipment_not_found'
          });
        }
        
        // Get user's org ID
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('org_id')
          .eq('id', user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return createErrorResponse(`Failed to get user profile: ${profileError.message}`);
        }
        
        // Same org check - different logic for view vs edit/delete
        if (userProfile.org_id === equipment.org_id) {
          // For view action, same org is sufficient
          if (action === 'view') {
            return createSuccessResponse({
              has_permission: true,
              reason: 'same_organization'
            });
          }
          
          // For edit/delete, check if user has a manager or owner role
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user_id)
            .eq('org_id', equipment.org_id)
            .single();
            
          if (userRoles && ['owner', 'manager'].includes(userRoles.role)) {
            return createSuccessResponse({
              has_permission: true,
              reason: 'org_role',
              role: userRoles.role
            });
          }
        }
        
        // Team-based permission check if equipment belongs to a team
        if (equipment.team_id) {
          // Get app_user.id from auth_uid
          const { data: appUser, error: appUserError } = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_uid', user_id)
            .single();
            
          if (appUserError) {
            console.error('Error fetching app user:', appUserError);
            return createSuccessResponse({
              has_permission: false,
              reason: 'user_not_found'
            });
          }
          
          // Check if user is member of this team
          const { data: teamMember, error: teamMemberError } = await supabase
            .from('team_member')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('team_id', equipment.team_id)
            .single();
            
          if (teamMemberError && !teamMemberError.message.includes('No rows found')) {
            console.error('Error checking team membership:', teamMemberError);
            return createErrorResponse(`Team membership check error: ${teamMemberError.message}`);
          }
          
          if (teamMember) {
            // Get user's role in this team
            const { data: teamRole, error: roleError } = await supabase
              .from('team_roles')
              .select('role')
              .eq('team_member_id', teamMember.id)
              .single();
              
            if (roleError && !roleError.message.includes('No rows found')) {
              console.error('Error fetching team role:', roleError);
              return createErrorResponse(`Team role check error: ${roleError.message}`);
            }
            
            if (teamRole) {
              // Define allowed roles for each action
              const role = teamRole.role;
              let hasPermission = false;
              
              if (action === 'view') {
                // All roles can view
                hasPermission = true;
              } else if (action === 'edit' || action === 'delete') {
                // Only manager, owner and creator roles can edit/delete
                hasPermission = ['manager', 'owner', 'creator'].includes(role);
              }
              
              return createSuccessResponse({
                has_permission: hasPermission,
                reason: 'team_role',
                role: role
              });
            }
          }
        }
        
        // No permission by default
        return createSuccessResponse({
          has_permission: false,
          reason: 'insufficient_permissions'
        });
        
      } catch (err) {
        console.error('Error during permission check:', err);
        return createErrorResponse(`Error processing permission check: ${err.message}`);
      }
    }
    
    // Invalid action
    return createErrorResponse(`Invalid action: ${action}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
