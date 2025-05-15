
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);
const appUrl = Deno.env.get("APP_URL") || "http://localhost:3000";

// Inline cors headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  recipientEmail: string;
  teamName: string;
  inviterEmail: string;
  inviterName?: string;
  token: string;
  action: "invite" | "resend";
  role: string;
}

// Alternative method: Use the invitation_id to fetch details
interface InvitationDetailRequest {
  invitation_id: string;
  team_name?: string;
  org_name?: string;
  requester_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // For backwards compatibility, handle both direct email params and invitation_id
    if (requestData.invitation_id) {
      // Admin client for fetching invitation details
      const adminResponse = await fetch(`${supabaseUrl}/rest/v1/team_invitations?id=eq.${requestData.invitation_id}&select=*,team:team_id(id,name,org_id,organization:org_id(name))`, {
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`
        }
      });
      
      if (!adminResponse.ok) {
        console.error("Error fetching invitation details:", await adminResponse.text());
        return new Response(
          JSON.stringify({ error: "Failed to fetch invitation details" }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      const invitationData = await adminResponse.json();
      
      if (!invitationData || invitationData.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invitation not found" }),
          { 
            status: 404, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      const invitation = invitationData[0];
      const teamName = requestData.team_name || invitation.team?.name || "Unknown Team";
      const orgName = requestData.org_name || invitation.team?.organization?.name || "Unknown Organization";
      const inviterName = requestData.requester_name || invitation.invited_by_email?.split('@')[0] || "A team manager";
      
      // Send the email with invitation details
      return await sendInvitationEmail({
        recipientEmail: invitation.email,
        teamName: teamName,
        orgName: orgName,
        inviterName: inviterName,
        inviterEmail: invitation.invited_by_email || "no-reply@equipqr.app",
        token: invitation.token,
        action: "resend",
        role: invitation.role
      });
    } else {
      // Original direct params approach
      const { recipientEmail, teamName, inviterEmail, inviterName, token, action, role } = 
        requestData as InvitationEmailRequest;
      
      if (!recipientEmail || !teamName || !token) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      return await sendInvitationEmail({
        recipientEmail,
        teamName,
        inviterName: inviterName || inviterEmail.split('@')[0],
        inviterEmail,
        token,
        action,
        role,
        orgName: undefined
      });
    }
  } catch (error: any) {
    console.error("Error in send_invitation_email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

async function sendInvitationEmail({
  recipientEmail,
  teamName,
  inviterEmail,
  inviterName,
  token,
  action,
  role,
  orgName
}: InvitationEmailRequest & { orgName?: string }): Promise<Response> {
  try {
    console.log(`Sending ${action} invitation email to ${recipientEmail} for team ${teamName}`);
    
    // Construct the invitation acceptance URL
    const invitationUrl = `${appUrl}/invitation/${token}`;
    const displayName = inviterName || inviterEmail.split('@')[0];
    
    // Create email subject based on action
    const subject = action === "resend" 
      ? `Reminder: You've been invited to join ${teamName}`
      : `You've been invited to join ${teamName}`;

    // Create HTML for the email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Team Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Team Invitation</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>${displayName} (${inviterEmail}) has invited you to join the team <strong>${teamName}</strong> as a <strong>${role}</strong>.</p>
              
              ${orgName ? `<p>This team is part of the <strong>${orgName}</strong> organization.</p>` : ''}
              
              <p>To accept this invitation, please click the button below:</p>
              
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
              
              <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
              <p>${invitationUrl}</p>
              
              <p>This invitation will expire in 7 days.</p>
              
              <p>Thank you,<br>The equipqr Team</p>
            </div>
            <div class="footer">
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    const { data, error } = await resend.emails.send({
      from: "equipqr <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: html,
      reply_to: inviterEmail,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in sendInvitationEmail helper:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
}

serve(handler);
