
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-LICENSE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    logStep("Constructing webhook event", { hasSignature: !!signature, bodyLength: body.length });

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout session", { sessionId: session.id });

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const organizationId = session.metadata?.organization_id;
        const licenseQuantity = parseInt(session.metadata?.license_quantity || "0");

        if (!organizationId || !licenseQuantity) {
          logStep("Missing metadata", { organizationId, licenseQuantity });
          return new Response("Missing required metadata", { 
            status: 400,
            headers: corsHeaders 
          });
        }

        logStep("Creating license subscription record", { 
          organizationId, 
          licenseQuantity,
          subscriptionId: subscription.id 
        });

        // Create user license subscription record
        await supabaseClient.from("user_license_subscriptions").insert({
          organization_id: organizationId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: subscription.items.data[0].price.id,
          quantity: licenseQuantity,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        logStep("Synchronizing organization slots");

        // Sync organization slots
        await supabaseClient.rpc("sync_stripe_subscription_slots", {
          org_id: organizationId,
          subscription_id: subscription.id,
          quantity: licenseQuantity,
          period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        logStep("License purchase processed successfully");
      }
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        logStep("Processing subscription renewal", { subscriptionId: invoice.subscription });
        
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        // Update subscription record
        await supabaseClient
          .from("user_license_subscriptions")
          .update({
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        logStep("Subscription renewal processed");
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription update", { subscriptionId: subscription.id });

      // Get the previous subscription data to detect quantity changes
      const { data: existingRecord } = await supabaseClient
        .from("user_license_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (existingRecord) {
        const newQuantity = subscription.items.data[0].quantity || 1;
        const oldQuantity = existingRecord.quantity;

        // Update subscription record
        await supabaseClient
          .from("user_license_subscriptions")
          .update({
            quantity: newQuantity,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // If quantity was reduced, we need to handle member cleanup
        if (newQuantity < oldQuantity) {
          logStep("Handling license quantity reduction", { oldQuantity, newQuantity });
          
          // Get organization ID from existing record
          const organizationId = existingRecord.organization_id;
          
          // Get current active members (excluding owners)
          const { data: members } = await supabaseClient
            .from("organization_members")
            .select("user_id, role, joined_date")
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .order("joined_date", { ascending: false }); // Most recent first

          if (members) {
            const billableMembers = members.filter(m => m.role !== "owner");
            const excessMembers = billableMembers.length - newQuantity;

            if (excessMembers > 0) {
              // Remove the most recently added members first
              const membersToRemove = billableMembers.slice(0, excessMembers);
              
              for (const member of membersToRemove) {
                await supabaseClient
                  .from("organization_members")
                  .update({ status: "inactive" })
                  .eq("user_id", member.user_id)
                  .eq("organization_id", organizationId);
                
                logStep("Deactivated member due to license reduction", { 
                  userId: member.user_id, 
                  organizationId 
                });
              }
            }
          }
        }

        // Update organization slots
        await supabaseClient.rpc("sync_stripe_subscription_slots", {
          org_id: existingRecord.organization_id,
          subscription_id: subscription.id,
          quantity: newQuantity,
          period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        logStep("Subscription update processed");
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

      // Update subscription status
      await supabaseClient
        .from("user_license_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      // Get organization ID to handle member cleanup
      const { data: subscriptionRecord } = await supabaseClient
        .from("user_license_subscriptions")
        .select("organization_id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (subscriptionRecord) {
        // Deactivate all non-owner members when subscription is cancelled
        await supabaseClient
          .from("organization_members")
          .update({ status: "inactive" })
          .eq("organization_id", subscriptionRecord.organization_id)
          .neq("role", "owner");

        logStep("Deactivated all non-owner members due to subscription cancellation", {
          organizationId: subscriptionRecord.organization_id
        });
      }

      logStep("Subscription cancelled");
    }

    return new Response("Webhook processed", { 
      status: 200,
      headers: corsHeaders 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }
});
