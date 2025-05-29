
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOWNLOAD-INVOICE] ${step}${detailsStr}`);
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
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { billing_id } = await req.json();
    
    if (!billing_id) {
      throw new Error("billing_id is required");
    }

    logStep("Request params", { billing_id, userId: user.id });

    // Get billing record and verify ownership
    const { data: billingRecord, error: billingError } = await supabaseClient
      .from('organization_storage_billing')
      .select('*, organization!inner(id)')
      .eq('id', billing_id)
      .single();

    if (billingError || !billingRecord) {
      throw new Error("Billing record not found");
    }

    // Verify user is organization owner
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', billingRecord.org_id)
      .single();

    if (roleError || !userRole || userRole.role !== 'owner') {
      throw new Error("Only organization owners can download invoices");
    }

    logStep("User role verified", { role: userRole.role });

    // For now, return the billing record details as a downloadable receipt
    // In a full implementation, you would generate a proper PDF invoice
    const receiptData = {
      invoice_number: `INV-${billingRecord.id.slice(0, 8).toUpperCase()}`,
      billing_period: `${new Date(billingRecord.billing_period_start).toLocaleDateString()} - ${new Date(billingRecord.billing_period_end).toLocaleDateString()}`,
      overage_gb: billingRecord.overage_gb,
      amount: `$${(billingRecord.overage_amount_cents / 100).toFixed(2)}`,
      status: billingRecord.status,
      date: new Date(billingRecord.created_at).toLocaleDateString()
    };

    // Create a simple text receipt (in production, you'd generate a PDF)
    const receiptText = `
STORAGE OVERAGE INVOICE
${receiptData.invoice_number}

Billing Period: ${receiptData.billing_period}
Storage Overage: ${receiptData.overage_gb} GB
Amount: ${receiptData.amount}
Status: ${receiptData.status.toUpperCase()}
Date: ${receiptData.date}

Thank you for your business!
    `.trim();

    // Return the receipt as a downloadable text file
    return new Response(receiptText, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="invoice-${receiptData.invoice_number}.txt"`,
      },
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
