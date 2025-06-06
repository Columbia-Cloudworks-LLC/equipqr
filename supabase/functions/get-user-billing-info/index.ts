
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-USER-BILLING-INFO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    logStep("Function started");

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

    const { org_id } = await req.json();
    
    if (!org_id) {
      throw new Error("org_id is required");
    }

    logStep("Checking user billing info with exemptions", { orgId: org_id, userId: user.id });

    // Verify user has access to this organization
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (roleError || !userRole) {
      return new Response(JSON.stringify({ 
        error: "user_not_in_org",
        message: "User does not have access to this organization"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check for active subscription
    const { data: activeSubscription, error: subscriptionError } = await supabaseClient
      .from('organization_subscriptions')
      .select('*')
      .eq('org_id', org_id)
      .eq('status', 'active')
      .single();

    logStep("Active subscription check", { activeSubscription, subscriptionError });

    // Calculate user billing info with exemptions using the fixed function
    const { data: billingInfo, error: billingError } = await supabaseClient
      .rpc('calculate_org_user_billing_with_exemptions', {
        p_org_id: org_id
      });

    if (billingError) {
      logStep("Error calculating billing info with exemptions", billingError);
      throw new Error("Failed to calculate billing information");
    }

    logStep("Billing calculation result", billingInfo);

    // Get grace period info
    const { data: gracePeriodInfo, error: gracePeriodError } = await supabaseClient
      .rpc('get_org_grace_period_info', {
        p_org_id: org_id
      });

    if (gracePeriodError) {
      logStep("Error getting grace period info", gracePeriodError);
      throw new Error("Failed to get grace period information");
    }

    logStep("Grace period info", gracePeriodInfo);

    // Determine billing status
    const hasActiveSubscription = !!activeSubscription;
    const hasEquipment = billingInfo?.equipment_count > 0;
    const hasBillableUsers = billingInfo?.billable_users > 0;
    const billingRequired = hasEquipment && hasBillableUsers;
    const exemptionApplied = billingInfo?.exemption_applied || false;
    const hasFullExemption = exemptionApplied && billingInfo?.exemption_details?.exemption_type === 'full';

    logStep("Billing status determination", {
      hasActiveSubscription,
      hasEquipment,
      hasBillableUsers,
      billingRequired,
      exemptionApplied,
      hasFullExemption,
      exemptionDetails: billingInfo?.exemption_details
    });

    // Enhanced grace period info with exemption awareness
    const enhancedGracePeriodInfo = gracePeriodInfo ? {
      ...gracePeriodInfo,
      // Grace period should NOT be active if:
      // 1. Has active subscription OR
      // 2. Has full exemption OR
      // 3. No billing required (no equipment or no billable users)
      is_active: gracePeriodInfo.is_active && 
                 !hasActiveSubscription && 
                 !hasFullExemption && 
                 billingRequired,
      exemption_aware: true,
      billing_required: billingRequired,
      has_full_exemption: hasFullExemption
    } : null;

    // Enhanced billing info with subscription status
    const enhancedBillingInfo = billingInfo ? {
      ...billingInfo,
      billing_required: billingRequired,
      has_active_subscription: hasActiveSubscription,
      subscription_details: activeSubscription ? {
        status: activeSubscription.status,
        current_period_end: activeSubscription.current_period_end,
        stripe_customer_id: activeSubscription.stripe_customer_id
      } : null
    } : null;

    logStep("Enhanced billing info calculated", { 
      enhancedBillingInfo, 
      enhancedGracePeriodInfo,
      hasActiveSubscription,
      billingRequired,
      exemptionApplied,
      hasFullExemption
    });

    return new Response(JSON.stringify({
      billing_info: enhancedBillingInfo,
      grace_period_info: enhancedGracePeriodInfo,
      user_role: userRole.role
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
