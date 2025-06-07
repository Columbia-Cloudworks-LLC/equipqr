
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

    // Determine feature category based on feature key
    const featureCategory = feature_key === 'fleet_map' ? 'premium' : 'base';
    console.log(`Feature ${feature_key} categorized as ${featureCategory}`);

    // Check for active billing exemptions FIRST (highest priority)
    let exemption_details = null;
    let hasExemption = false;

    const { data: exemptions, error: exemptionError } = await supabaseClient
      .from('organization_billing_exemptions')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true)
      .single();

    if (!exemptionError && exemptions) {
      // Check if exemption is still valid (not expired)
      const isValidExemption = !exemptions.expires_at || new Date(exemptions.expires_at) > new Date();
      
      if (isValidExemption) {
        hasExemption = true;
        exemption_details = {
          type: exemptions.exemption_type,
          reason: exemptions.reason,
          expires_at: exemptions.expires_at,
          free_user_count: exemptions.free_user_count
        };
        console.log(`Found valid active exemption:`, exemption_details);
      } else {
        console.log(`Found expired exemption for org ${org_id}, expires_at: ${exemptions.expires_at}`);
      }
    } else {
      console.log(`No active exemptions found for org ${org_id}`);
    }

    // If we have a valid exemption, grant access immediately
    if (hasExemption) {
      console.log(`Granting access due to valid exemption`);
      
      const response = {
        has_access: true,
        subscription_details: null,
        grace_period_info: null,
        exemption_details,
        user_role: userRole.role,
        feature_category: featureCategory,
        reason: "exemption_granted"
      };

      console.log(`Final response (exemption granted):`, response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // No exemption found, proceed with normal subscription/grace period checks
    const { data: hasAccess, error: accessError } = await supabaseClient
      .rpc('get_org_feature_access_categorized', {
        p_org_id: org_id,
        p_feature_key: feature_key,
        p_feature_category: featureCategory
      });

    if (accessError) {
      console.error('Error checking feature access:', accessError);
      throw new Error("Failed to check feature access");
    }

    console.log(`Database function result: ${hasAccess} for category ${featureCategory}`);

    // Get additional details for response
    let subscription_details = null;
    let gracePeriodInfo = null;

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

    // Get grace period information (only relevant for base features)
    if (featureCategory === 'base') {
      const { data: gracePeriodData } = await supabaseClient
        .rpc('get_org_grace_period_info', {
          p_org_id: org_id
        });
      gracePeriodInfo = gracePeriodData;
    }

    // Determine access reason based on database function result and feature category
    let accessReason = "no_subscription";
    if (hasAccess) {
      if (subscription_details) {
        accessReason = "subscription_active";
      } else if (featureCategory === 'base' && gracePeriodInfo?.grace_period_active) {
        accessReason = "grace_period_active";
      } else {
        accessReason = "access_granted";
      }
    } else {
      if (featureCategory === 'premium') {
        accessReason = "premium_subscription_required";
      } else {
        accessReason = "no_subscription";
      }
    }

    const response = {
      has_access: hasAccess,
      subscription_details,
      grace_period_info: gracePeriodInfo,
      exemption_details: null, // No exemption in this path
      user_role: userRole.role,
      feature_category: featureCategory,
      reason: accessReason
    };

    console.log(`Final response (no exemption):`, response);

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
