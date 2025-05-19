
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
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

/**
 * Check if a string is a valid UUID
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Try multiple approaches to check equipment creation permission
 * with improved type handling and debugging
 */
async function tryPermissionCheck(supabase: any, user_id: string, team_id: string | null) {
  // Validate input parameters again for safety
  if (!isValidUuid(user_id)) {
    throw new Error('Invalid UUID format for user_id');
  }
  
  if (team_id !== null && team_id !== undefined && !isValidUuid(team_id)) {
    throw new Error('Invalid UUID format for team_id');
  }

  // Attempt #1: Try the simplified_equipment_create_permission function first (new optimized function)
  try {
    console.log('Attempt #1: Using simplified_equipment_create_permission');
    const { data: simplifiedData, error: simplifiedError } = await supabase.rpc(
      'simplified_equipment_create_permission',
      { 
        p_user_id: user_id,
        p_team_id: team_id
      }
    );

    if (simplifiedError) {
      console.error('Simplified permission check error:', simplifiedError);
      throw simplifiedError;
    }
    
    console.log('Attempt #1 successful:', simplifiedData);
    return simplifiedData;
  } catch (error1) {
    console.error('Attempt #1 failed:', error1);
    
    // Attempt #2: Try the check_equipment_create_permission function with explicit parameters
    try {
      console.log('Attempt #2: Using check_equipment_create_permission with explicit parameters');
      const { data, error } = await supabase.rpc(
        'check_equipment_create_permission',
        { 
          p_user_id: user_id,
          p_team_id: team_id
        }
      );

      if (error) {
        console.error('check_equipment_create_permission error:', error);
        throw error;
      }
      
      console.log('Attempt #2 successful:', data);
      
      // Process and normalize the result to ensure consistent format
      if (Array.isArray(data) && data.length > 0) {
        return {
          can_create: data[0].has_permission,
          org_id: data[0].org_id,
          reason: data[0].reason || 'unknown'
        };
      }
      return data;
    } catch (error2) {
      console.error('Attempt #2 failed:', error2);
      
      // Attempt #3: Try a direct database query approach with RPC function
      try {
        console.log('Attempt #3: Using rpc_check_equipment_permission function');
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'rpc_check_equipment_permission',
          { 
            user_id: user_id,
            action: 'create',
            team_id: team_id
          }
        );

        if (rpcError) {
          console.error('rpc_check_equipment_permission error:', rpcError);
          throw rpcError;
        }
        
        console.log('Attempt #3 successful:', rpcData);
        return rpcData;
      } catch (error3) {
        console.error('Attempt #3 failed:', error3);
        
        // Final attempt: Try with direct access to can_create_equipment_safe function
        try {
          console.log('Attempt #4: Using can_create_equipment_safe');
          const { data: safeData, error: safeError } = await supabase.rpc(
            'can_create_equipment_safe',
            { 
              p_user_id: user_id,
              p_team_id: team_id
            }
          );

          if (safeError) {
            console.error('can_create_equipment_safe error:', safeError);
            throw safeError;
          }
          
          console.log('Attempt #4 successful:', safeData);
          
          // Format response consistently
          return {
            can_create: safeData === true,
            org_id: null, // This function doesn't return org_id
            reason: safeData ? 'safe_check' : 'denied_by_safe_check'
          };
        } catch (error4) {
          console.error('Attempt #4 failed:', error4);
          throw new Error('All permission check methods failed');
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('No authorization header provided');
    } else {
      console.log('Authorization header is present');
    }

    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log(`Raw request body: ${rawBody}`);
    
    // Parse the request body
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return createErrorResponse(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    let { user_id, team_id } = body;
    
    // Validate parameters
    if (!user_id) {
      console.error('Missing required parameter: user_id');
      return createErrorResponse("Missing required parameter: user_id");
    }
    
    // Log parameters with types for debugging
    console.log(`Parameters received: user_id=${user_id} (${typeof user_id}), team_id=${team_id || 'null'} (${typeof team_id})`);
    
    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error(`Invalid UUID format for user_id: ${user_id}`);
      return createErrorResponse("Invalid UUID format for user_id");
    }
    
    // Handle team_id nulls and validate format if provided
    if (team_id === 'null' || team_id === 'none' || team_id === '') {
      team_id = null;
      console.log('Normalized team_id to null');
    } else if (team_id !== null && !uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return createErrorResponse("Invalid UUID format for team_id");
    }
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });
    
    // Try multiple permission check approaches
    try {
      const permissionData = await tryPermissionCheck(supabase, user_id, team_id);
      
      if (!permissionData) {
        console.error('Permission check returned no data');
        return createErrorResponse('Permission check failed: No data returned');
      }
      
      // Format the response consistently regardless of the method used
      const formattedResponse = {
        can_create: permissionData.has_permission || permissionData.can_create || false,
        org_id: permissionData.org_id,
        reason: permissionData.reason || 'unknown'
      };
      
      console.log('Final permission check result:', formattedResponse);
      return createSuccessResponse(formattedResponse);
      
    } catch (error) {
      console.error('All permission check attempts failed:', error);
      
      // Handle authorization errors specially
      if (authHeader === null || authHeader === undefined) {
        return createErrorResponse('Authentication required. Please sign in to continue.', 401);
      }
      
      // Provide a more specific error message based on the error
      if (error.message?.includes('operator does not exist')) {
        return createErrorResponse('Database type mismatch error. Please report this to support.', 500);
      }
      
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return createErrorResponse('Required database function is missing. The system administrator has been notified.', 500);
      }
      
      if (error.message?.includes('type mismatch') || error.message?.includes('convert')) {
        return createErrorResponse('Data type conversion error. Please try again or contact support.', 500);
      }
      
      return createErrorResponse(`Permission check failed: ${error.message || 'Unknown error'}`, 500);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error', 500);
  }
});
