
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STORAGE-OVERAGE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
    const { org_id, overage_gb, billing_period_start, billing_period_end } = await req.json();
    
    if (!org_id || !overage_gb || !billing_period_start || !billing_period_end) {
      throw new Error("org_id, overage_gb, billing_period_start, and billing_period_end are required");
    }

    logStep("Request params", { org_id, overage_gb, billing_period_start, billing_period_end });

    // Verify user is organization owner (UPDATED: Only owners can manage billing)
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (roleError || !userRole || userRole.role !== 'owner') {
      return new Response(JSON.stringify({ 
        error: "access_denied",
        message: "Only organization owners can manage billing"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
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

      // Update organization_subscriptions table
      await supabaseClient
        .from('organization_subscriptions')
        .upsert({
          org_id,
          stripe_customer_id: customerId,
          status: 'inactive'
        });
    }

    // Calculate overage amount (in cents)
    const overageAmountCents = Math.ceil(parseFloat(overage_gb) * 10); // $0.10 per GB

    // Create checkout session for storage overage
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Storage Overage",
            description: `Storage overage for ${org.name} (${overage_gb} GB over 5GB limit)`
          },
          unit_amount: overageAmountCents,
        },
        quantity: 1,
      }],
      mode: "payment", // One-time payment for overage
      success_url: `${req.headers.get("origin")}/organization?tab=billing&success=true&type=storage`,
      cancel_url: `${req.headers.get("origin")}/organization?tab=billing&cancelled=true&type=storage`,
      metadata: {
        org_id,
        overage_gb: overage_gb.toString(),
        billing_period_start,
        billing_period_end,
        user_id: user.id,
        type: 'storage_overage'
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Create billing record
    await supabaseClient
      .from('organization_storage_billing')
      .insert({
        org_id,
        billing_period_start,
        billing_period_end,
        overage_gb: parseFloat(overage_gb),
        overage_amount_cents: overageAmountCents,
        status: 'pending'
      });

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
