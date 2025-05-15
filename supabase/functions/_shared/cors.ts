
// CORS headers for Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Handle CORS preflight requests
export function handleCorsPreflightRequest() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Helper to create standardized error responses
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ 
      error: message 
    }),
    { 
      status, 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      } 
    }
  );
}

// Helper to create standardized success responses
export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      } 
    }
  );
}
