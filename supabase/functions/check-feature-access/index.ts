
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { org_id, feature_key } = await req.json();
    
    if (!org_id || !feature_key) {
      throw new Error("org_id and feature_key are required");
    }

    // Verify user has access to this organization
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (roleError || !userRole) {
      return new Response(JSON.stringify({ 
        has_access: false, 
        reason: "user_not_in_org" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Use the database function to check feature access
    const { data: hasAccess, error: accessError } = await supabaseClient
      .rpc('get_org_feature_access', {
        p_org_id: org_id,
        p_feature_key: feature_key
      });

    if (accessError) {
      console.error('Error checking feature access:', accessError);
      throw new Error("Failed to check feature access");
    }

    // Get subscription details if they have access
    let subscription_details = null;
    if (hasAccess) {
      const { data: subDetails } = await supabaseClient
        .from('feature_subscriptions')
        .select(`
          *,
          subscription_features (name, description),
          organization_subscriptions (status, current_period_end)
        `)
        .eq('org_id', org_id)
        .eq('subscription_features.feature_key', feature_key)
        .single();

      subscription_details = subDetails;
    }

    return new Response(JSON.stringify({
      has_access: hasAccess,
      subscription_details,
      user_role: userRole.role
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in check-feature-access:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
