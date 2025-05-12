
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  checkEquipmentAccess,
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  AccessResult
} from '../_shared/permissions.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equipment_id, user_id } = await req.json();
    
    if (!equipment_id || !user_id) {
      return createErrorResponse("Missing required parameters: equipment_id and user_id must be provided");
    }

    // Create Supabase admin client - this bypasses RLS policies
    const supabase = createAdminClient();
    
    // Use the shared equipment access check function that uses direct queries
    // to avoid RLS policy recursion issues
    const accessResult = await checkEquipmentAccess(supabase, user_id, equipment_id);
    
    // Additional check for more specific work notes permissions
    let canCreate = false;
    let canManage = false;
    
    if (accessResult.hasAccess) {
      // Get more detailed role information if the user has basic access
      if (accessResult.reason === 'org_owner' || accessResult.role === 'owner') {
        // Org owners can do everything
        canCreate = true;
        canManage = true;
      } else if (accessResult.reason === 'team_access') {
        // Team-based checks
        if (accessResult.role === 'manager') {
          canCreate = true;
          canManage = true;
        } else if (accessResult.role === 'technician') {
          canCreate = true;
          canManage = false;
        }
      } else if (accessResult.reason === 'cross_org_access') {
        // Cross-organization access - allow view and create based on role
        if (accessResult.role === 'manager') {
          canCreate = true;
          canManage = true;
        } else if (accessResult.role === 'technician') {
          canCreate = true;
          canManage = false;
        } else {
          // Viewers in cross-org context
          canCreate = false;
          canManage = false;
        }
      }
    }
    
    return createSuccessResponse({
      has_access: accessResult.hasAccess,
      can_create: canCreate,
      can_manage: canManage,
      access_reason: accessResult.reason,
      role: accessResult.role,
      details: accessResult.details
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
