import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-INVITATION] ${step}${detailsStr}`);
};

interface InvitationEmailRequest {
  invitationId: string;
  email: string;
  role: string;
  organizationName: string;
  inviterName: string;
  message?: string;
}

serve(async (req) => {
  try {
    logStep("Function started");

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      invitationId, 
      email, 
      role, 
      organizationName, 
      inviterName,
      message 
    }: InvitationEmailRequest = await req.json();

    logStep("Request received", { invitationId, email, role, organizationName });

    // Get the invitation token and organization logo from the database
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('organization_invitations')
      .select(`
        invitation_token,
        organizations!inner(name, logo)
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invitation not found');
    }

    logStep("Invitation token retrieved", { token: invitation.invitation_token });

    // Get organization logo from the invitation data
    const organizationLogo = invitation.organizations?.logo;

    // Construct the invitation URL using production URL if available
    const baseUrl = Deno.env.get("PRODUCTION_URL") || `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}.lovableproject.com`;
    const invitationUrl = `${baseUrl}/invitation/${invitation.invitation_token}`;
    
    // Construct absolute URLs for logos
    const equipQRLogoUrl = `${baseUrl}/eqr-icons/inverse.png`;

    // Create email HTML content
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Logos Section -->
        <div style="text-align: center; margin-bottom: 24px; padding: 20px 0;">
          <div style="display: inline-flex; align-items: center; gap: 20px; justify-content: center; flex-wrap: wrap;">
            <!-- EquipQR Logo -->
            <div style="flex: 0 0 auto;">
              <img src="${equipQRLogoUrl}" alt="EquipQR Logo" style="height: 48px; width: auto; display: block;" />
            </div>
            ${organizationLogo ? `
            <!-- Organization Logo -->
            <div style="flex: 0 0 auto;">
              <img src="${organizationLogo}" alt="${organizationName} Logo" style="height: 48px; width: auto; display: block;" />
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0;">EquipQR</h1>
          <p style="color: #666; font-size: 16px; margin: 8px 0 0 0;">Fleet Equipment Management</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 16px 0;">You're invited to join ${organizationName}</h2>
          <p style="color: #666; font-size: 16px; margin: 0 0 16px 0;">
            ${inviterName} has invited you to join their organization as a <strong>${role}</strong> on EquipQR.
          </p>
          ${message ? `
            <div style="background: white; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <p style="color: #374151; font-style: italic; margin: 0;">"${message}"</p>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationUrl}" 
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>

        <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 24px 0;">
          <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">What you'll get access to:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Equipment tracking and management</li>
            <li>Work order creation and tracking</li>
            <li>Team collaboration tools</li>
            <li>QR code scanning for equipment</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <div style="text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">
            If you can't click the button above, copy and paste this link into your browser:
          </p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 0;">
            ${invitationUrl}
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    // Send the email
    logStep("Sending email", { to: email, from: "invite@equipqr.app" });

    const emailResponse = await resend.emails.send({
      from: "EquipQR <invite@equipqr.app>",
      to: [email],
      subject: `You're invited to join ${organizationName} on EquipQR`,
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});