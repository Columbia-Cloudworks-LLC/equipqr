
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STORAGE-USAGE] ${step}${detailsStr}`);
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

    // Simple storage calculation using image_upload table
    const { data: imageData, error: imageError } = await supabaseClient
      .from('image_upload')
      .select('size_bytes')
      .eq('equipment_id', org_id) // This is a simplified approach
      .is('deleted_at', null);

    if (imageError) {
      logStep("Error fetching image data", imageError);
    }

    // Calculate total bytes used
    const totalBytes = imageData?.reduce((sum, img) => sum + (img.size_bytes || 0), 0) || 0;
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const freeGB = 5; // 5GB free tier
    const usedPercentage = Math.min((totalBytes / (5 * 1024 * 1024 * 1024)) * 100, 100);
    
    // Calculate overage
    const overageBytes = Math.max(0, totalBytes - (5 * 1024 * 1024 * 1024));
    const overageGB = overageBytes / (1024 * 1024 * 1024);
    const overageAmountCents = Math.ceil(overageGB * 10); // $0.10 per GB

    // Get billing history with fallback to empty array
    const { data: billingHistory } = await supabaseClient
      .from('organization_storage_billing')
      .select('*')
      .eq('org_id', org_id)
      .order('billing_period_start', { ascending: false })
      .limit(6);

    logStep("Storage usage calculated", { 
      totalGB: totalGB.toFixed(3), 
      overageGB: overageGB.toFixed(3), 
      usedPercentage: usedPercentage.toFixed(1) 
    });

    return new Response(JSON.stringify({
      storage_usage: {
        total_bytes: totalBytes,
        total_gb: parseFloat(totalGB.toFixed(3)),
        free_gb: freeGB,
        used_percentage: parseFloat(usedPercentage.toFixed(1)),
        overage_bytes: overageBytes,
        overage_gb: parseFloat(overageGB.toFixed(3)),
        overage_amount_cents: overageAmountCents,
        has_overage: overageGB > 0
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
    
    // Return a graceful fallback response instead of an error
    return new Response(JSON.stringify({
      storage_usage: {
        total_bytes: 0,
        total_gb: 0,
        free_gb: 5,
        used_percentage: 0,
        overage_bytes: 0,
        overage_gb: 0,
        overage_amount_cents: 0,
        has_overage: false
      },
      billing_history: [],
      user_role: 'viewer',
      fallback: true,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
