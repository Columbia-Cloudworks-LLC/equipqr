
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { createAdminClient } from "./adminClient.ts";
import { corsHeaders } from "./cors.ts";
import { fetchUserTeams } from "./services/teamService.ts";
import { fetchUserEquipment } from "./services/equipmentService.ts";
import { fetchUserInvitations } from "./services/invitationService.ts";

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, org_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Fetching dashboard data for user: ${user_id}${org_id ? `, org: ${org_id}` : ''}`);
    
    // Create admin client for database operations
    const adminClient = createAdminClient();

    // Fetch data in parallel to minimize latency
    const [teamsResult, equipmentResult, invitationsResult] = await Promise.all([
      fetchUserTeams(adminClient, user_id, org_id),
      fetchUserEquipment(adminClient, user_id, org_id),
      fetchUserInvitations(adminClient, user_id)
    ]);
    
    // Log result counts for debugging
    console.log(`Teams result: ${teamsResult.success ? 'success' : 'failure'}, count: ${teamsResult.teams?.length || 0}`);
    console.log(`Equipment result: ${equipmentResult.success ? 'success' : 'failure'}, count: ${equipmentResult.equipment?.length || 0}`);
    console.log(`Invitations result: ${invitationsResult.success ? 'success' : 'failure'}, count: ${invitationsResult.invitations?.length || 0}`);
    
    // Handle potential errors from any of the services
    if (!teamsResult.success) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch teams", details: teamsResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Format response with all data
    const response = {
      teams: teamsResult.teams,
      equipment: equipmentResult.success ? equipmentResult.equipment : [],
      invitations: invitationsResult.success ? invitationsResult.invitations : [],
      metadata: {
        timestamp: Date.now(),
        teamsCount: teamsResult.teams.length,
        equipmentCount: equipmentResult.success ? equipmentResult.equipment.length : 0,
        invitationsCount: invitationsResult.success ? invitationsResult.invitations.length : 0,
      }
    };
    
    // Include errors if any service failed
    if (!equipmentResult.success) {
      response.metadata.equipmentError = equipmentResult.error;
    }
    
    if (!invitationsResult.success) {
      response.metadata.invitationsError = invitationsResult.error;
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error processing dashboard data request:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
