
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessValidator } from './teamAccessValidator.ts';

// Inline CORS headers instead of importing from shared module
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inline helper functions for consistent responses
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
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      throw new Error('Function execution timed out');
    }, 8000); // 8 seconds max execution time
    
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
      
      if (!uuidRegex.test(user_id)) {
        console.error(`Invalid UUID format for user_id: ${user_id}`);
        return createErrorResponse("Invalid user ID format");
      }
      
      // Create Supabase client with service role to bypass RLS
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      console.log(`Validating team access for user ${user_id} on team ${team_id}`);
      
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false
        },
        global: {
          headers: {
            'x-client-info': 'edge-function:validate_team_access'
          }
        }
      });
      
      // Create validator instance
      const validator = new TeamAccessValidator(adminClient);
      
      // Check access and get result
      const accessResult = await validator.validateAccess(user_id, team_id);
      
      console.log(`Access result for user ${user_id} on team ${team_id}:`, 
        JSON.stringify({
          has_access: accessResult.has_access,
          is_member: accessResult.is_member,
          access_reason: accessResult.access_reason,
          role: accessResult.role
        })
      );
      
      return createSuccessResponse(accessResult);
      
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
