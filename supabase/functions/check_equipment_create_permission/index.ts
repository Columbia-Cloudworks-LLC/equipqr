
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, team_id, org_id } = await req.json();
    
    if (!user_id || (!team_id && !org_id)) {
      return createErrorResponse("Missing required parameters");
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Use our optimized database function
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: user_id,
        p_team_id: team_id || null,
        p_org_id: org_id || null
      }
    );
    
    if (permissionError) {
      console.error('Error checking permission:', permissionError);
      return createErrorResponse(`Permission check error: ${permissionError.message}`);
    }
    
    if (!permissionData || permissionData.length === 0) {
      return createSuccessResponse({
        can_create: false,
        reason: 'unknown_error'
      });
    }
    
    // Return a properly formatted response
    return createSuccessResponse({
      can_create: permissionData[0].has_permission,
      org_id: permissionData[0].org_id,
      reason: permissionData[0].reason
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
