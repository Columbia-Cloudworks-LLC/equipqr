import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);
const appUrl = Deno.env.get("APP_URL") || "http://localhost:3000";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, teamName, inviterEmail, inviterName, token, action, role } = 
      await req.json() as InvitationEmailRequest;
    
    if (!recipientEmail || !teamName || !inviterEmail || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

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
              
              <p>To accept this invitation, please click the button below:</p>
              
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
              
              <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
              <p>${invitationUrl}</p>
              
              <p>This invitation will expire in 7 days.</p>
              
              <p>Thank you,<br>The Team Management System</p>
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
      from: "Team Management <onboarding@resend.dev>",
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
    
    // Log resend API key presence (not the actual key) for debugging
    console.log("Resend API key available:", !!resendApiKey);
    console.log("APP_URL:", appUrl);
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
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

serve(handler);
