
// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Create a success response with CORS headers
 */
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    }
  );
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      error: message
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status,
    }
  );
}
