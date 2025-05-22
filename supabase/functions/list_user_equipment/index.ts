
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { fetchUserEquipment } from "./services/equipmentDataService.ts";
import { formatEquipmentResponse } from "./equipment-formatter.ts";

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, org_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch equipment for the user
    const equipmentResult = await fetchUserEquipment(user_id, org_id);

    if (!equipmentResult.success) {
      return new Response(
        JSON.stringify({ error: equipmentResult.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Format equipment data for the response
    const formattedEquipment = formatEquipmentResponse(equipmentResult.equipment);

    return new Response(
      JSON.stringify(formattedEquipment),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
