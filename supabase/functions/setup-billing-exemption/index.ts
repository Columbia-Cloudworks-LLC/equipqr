
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-BILLING-EXEMPTION] ${step}${detailsStr}`);
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

    const { email, exemption_type, free_user_count, reason } = await req.json();
    
    if (!email || !exemption_type) {
      throw new Error("email and exemption_type are required");
    }

    logStep("Setting up billing exemption", { 
      email, 
      exemption_type, 
      free_user_count, 
      reason 
    });

    // Use the helper function to set up the exemption
    const { data, error } = await supabaseClient
      .rpc('setup_billing_exemption_by_email', {
        p_email: email,
        p_exemption_type: exemption_type,
        p_free_user_count: free_user_count,
        p_reason: reason
      });

    if (error) {
      logStep("Error setting up billing exemption", error);
      throw new Error(`Failed to set up billing exemption: ${error.message}`);
    }

    logStep("Billing exemption set up successfully", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
