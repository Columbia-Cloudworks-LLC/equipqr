
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_API_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_API_SECRET_KEY is not configured");
    }

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
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { feature_key, org_id } = await req.json();
    
    if (!feature_key || !org_id) {
      throw new Error("feature_key and org_id are required");
    }

    logStep("Request params", { feature_key, org_id });

    // Verify user has access to this organization
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (roleError || !userRole) {
      throw new Error("User does not have access to this organization");
    }

    if (!['owner', 'manager'].includes(userRole.role)) {
      throw new Error("Only owners and managers can manage subscriptions");
    }

    logStep("User role verified", { role: userRole.role });

    // Get organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organization')
      .select('name')
      .eq('id', org_id)
      .single();

    if (orgError) {
      throw new Error("Organization not found");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if organization already has a Stripe customer
    const { data: existingSub } = await supabaseClient
      .from('organization_subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', org_id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          org_id,
          user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("Created Stripe customer", { customerId });
    }

    // Define pricing based on feature
    let lineItems = [];
    
    if (feature_key === 'fleet_map') {
      // Get current user count for the organization
      const { data: userCount } = await supabaseClient
        .from('user_roles')
        .select('user_id', { count: 'exact' })
        .eq('org_id', org_id);

      const totalUsers = userCount?.length || 1;
      // No free users - bill for all users
      const billableUsers = totalUsers;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Fleet Map Feature",
            description: `Access to interactive fleet map for ${org.name}`
          },
          unit_amount: 1000, // $10.00 per user
          recurring: { interval: "month" },
        },
        quantity: billableUsers,
      });

      logStep("Fleet map pricing calculated", { totalUsers, billableUsers });
    }

    if (lineItems.length === 0) {
      throw new Error("Invalid feature key");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/organization-settings?tab=billing&success=true`,
      cancel_url: `${req.headers.get("origin")}/organization-settings?tab=billing&cancelled=true`,
      metadata: {
        org_id,
        feature_key,
        user_id: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
