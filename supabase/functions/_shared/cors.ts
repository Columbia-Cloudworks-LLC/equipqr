
// CORS headers for edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a successful response with CORS headers
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: 200,
    }
  );
}

// Create an error response with CORS headers
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status,
    }
  );
}
