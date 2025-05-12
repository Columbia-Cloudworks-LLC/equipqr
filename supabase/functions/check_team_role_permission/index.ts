
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  checkRolePermission,
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
    // Extract request data
    const body = await req.json();
    const { team_id, user_id } = body;
    
    if (!team_id || !user_id) {
      return createErrorResponse("Missing required parameters: team_id and user_id must be provided");
    }
    
    // Create Supabase client
    const supabase = createAdminClient();
    
    // Check role permission using the shared function
    const permissionResult = await checkRolePermission(supabase, user_id, team_id);
    
    return createSuccessResponse({ 
      hasPermission: permissionResult.hasAccess, 
      reason: permissionResult.reason,
      role: permissionResult.role,
      details: permissionResult.details
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message, 500);
  }
});
