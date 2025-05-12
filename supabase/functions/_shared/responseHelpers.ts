
import { corsHeaders } from './corsHeaders.ts';

// Helper to create successful JSON responses with CORS
export function createSuccessResponse(data: any, status: number = 200) {
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

// Helper to create error JSON responses with CORS
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    }
  );
}
