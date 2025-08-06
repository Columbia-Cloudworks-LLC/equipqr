
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-USER-LICENSES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for proper authorization checks
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    // Get user from token using service role client
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { quantity, organizationId } = await req.json();
    if (!quantity || !organizationId) {
      throw new Error("Quantity and organizationId are required");
    }
    logStep("Request data", { quantity, organizationId });

    // Verify user has admin access to organization using service role
    const { data: membership, error: membershipError } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError) {
      logStep("Membership query error", { error: membershipError });
      throw new Error("Failed to verify organization membership");
    }

    if (!membership || membership.role !== 'owner') {
      logStep("Authorization failed", { membership });
      throw new Error("Only organization owners can purchase licenses");
    }
    logStep("Authorization verified", { role: membership.role });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // Use existing product and price IDs for user licenses
    const PRODUCT_ID = 'prod_SOuD4IZFWxQrjB';
    const PRICE_ID = 'price_1RU6PMF7dmK1pWnR58UJKOPh'; // $10/month per license
    
    // Verify the price exists in Stripe
    try {
      await stripe.prices.retrieve(PRICE_ID);
      logStep("Using existing price", { priceId: PRICE_ID, productId: PRODUCT_ID });
    } catch (error) {
      logStep("ERROR: Price not found", { priceId: PRICE_ID, error: error.message });
      throw new Error(`Stripe price ${PRICE_ID} not found. Please verify the price ID.`);
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: PRICE_ID,
          quantity: quantity,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?cancelled=true`,
      metadata: {
        user_id: user.id,
        organization_id: organizationId,
        license_quantity: quantity.toString(),
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          license_quantity: quantity.toString(),
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in purchase-user-licenses", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
