
/*
 * DEPRECATED: This function has been consolidated into the unified 'permissions' function.
 * Use the 'permissions' function with resource='equipment' and action='read' instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future release.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return createErrorResponse(
    'This function is deprecated. Please use the unified "permissions" function with resource="equipment" and action="read".',
    410
  );
});
