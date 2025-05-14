
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { 
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  validateOrganizationAccess
} from '../_shared/index.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id must be provided");
    }

    // Create Supabase admin client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Validate organization access
    const result = await validateOrganizationAccess(
      supabaseUrl,
      supabaseServiceRoleKey,
      user_id
    );
    
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'An unexpected error occurred');
  }
});
