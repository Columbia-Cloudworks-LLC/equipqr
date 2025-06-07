
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

    console.log(`Checking feature access for org ${org_id}, feature ${feature_key}`);

    // Verify user has access to this organization
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (roleError || !userRole) {
      console.log(`User ${user.id} not in org ${org_id}`);
      return new Response(JSON.stringify({ 
        has_access: false, 
        reason: "user_not_in_org" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`User has role ${userRole.role} in org ${org_id}`);

    // Use the enhanced database function that checks exemptions
    const { data: hasAccess, error: accessError } = await supabaseClient
      .rpc('get_org_feature_access', {
        p_org_id: org_id,
        p_feature_key: feature_key
      });

    if (accessError) {
      console.error('Error checking feature access:', accessError);
      throw new Error("Failed to check feature access");
    }

    console.log(`Feature access result: ${hasAccess}`);

    // Get additional details for debugging
    let subscription_details = null;
    let exemption_details = null;

    // Check for active billing exemptions
    const { data: exemptions, error: exemptionError } = await supabaseClient
      .from('organization_billing_exemptions')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true)
      .single();

    if (!exemptionError && exemptions) {
      exemption_details = {
        type: exemptions.exemption_type,
        reason: exemptions.reason,
        expires_at: exemptions.expires_at,
        free_user_count: exemptions.free_user_count
      };
      console.log(`Found active exemption:`, exemption_details);
    } else {
      console.log(`No active exemptions found for org ${org_id}`);
    }

    // Get subscription details if they have access
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

    // Get grace period information
    const { data: gracePeriodInfo } = await supabaseClient
      .rpc('get_org_grace_period_info', {
        p_org_id: org_id
      });

    const response = {
      has_access: hasAccess,
      subscription_details,
      grace_period_info: gracePeriodInfo,
      exemption_details,
      user_role: userRole.role,
      reason: hasAccess ? "access_granted" : (exemption_details ? "exemption_check_failed" : "no_subscription")
    };

    console.log(`Final response:`, response);

    return new Response(JSON.stringify(response), {
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
