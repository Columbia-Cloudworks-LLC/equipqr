
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STORAGE-USAGE] ${step}${detailsStr}`);
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

    logStep("Checking storage usage", { orgId: org_id, userId: user.id });

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

    // Calculate current storage usage
    const { data: storageData, error: storageError } = await supabaseClient
      .rpc('calculate_storage_overage', {
        p_org_id: org_id,
        p_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        p_period_end: new Date().toISOString()
      });

    if (storageError) {
      console.error('Error calculating storage overage:', storageError);
      throw new Error("Failed to calculate storage usage");
    }

    const usage = storageData?.[0] || {
      total_bytes: 0,
      overage_bytes: 0,
      overage_gb: 0,
      overage_amount_cents: 0
    };

    // Get recent billing history
    const { data: billingHistory, error: billingError } = await supabaseClient
      .from('organization_storage_billing')
      .select('*')
      .eq('org_id', org_id)
      .order('billing_period_start', { ascending: false })
      .limit(6);

    if (billingError) {
      console.error('Error fetching billing history:', billingError);
    }

    // Convert bytes to GB for display
    const totalGB = (usage.total_bytes / (1024 * 1024 * 1024)).toFixed(3);
    const freeGB = 5;
    const usedPercentage = Math.min((usage.total_bytes / (5 * 1024 * 1024 * 1024)) * 100, 100);

    logStep("Storage usage calculated", { totalGB, overageGB: usage.overage_gb, usedPercentage });

    return new Response(JSON.stringify({
      storage_usage: {
        total_bytes: usage.total_bytes,
        total_gb: parseFloat(totalGB),
        free_gb: freeGB,
        used_percentage: usedPercentage,
        overage_bytes: usage.overage_bytes,
        overage_gb: usage.overage_gb,
        overage_amount_cents: usage.overage_amount_cents,
        has_overage: usage.overage_gb > 0
      },
      billing_history: billingHistory || [],
      user_role: userRole.role
    }), {
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
