
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from '@supabase/supabase-js'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const body = await req.json();

    // Validate required parameters
    const { email, organization_name, inviter_email, token, role } = body;

    if (!email || !token || !organization_name) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: email, organization_name, or token'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create formatted role name for the email
    const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);

    // Create invitation link
    const invitationLink = `${APP_URL}/invitation/${token}?type=organization`;

    // HTML content for the email
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">You're invited to join an organization on equipqr</h2>
        <p>Hello,</p>
        <p><strong>${inviter_email}</strong> has invited you to join <strong>${organization_name}</strong> as a <strong>${roleDisplayName}</strong>.</p>
        <p>Click the button below to accept this invitation:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #3182ce;">${invitationLink}</p>
        <p style="margin-top: 40px; color: #718096; font-size: 14px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `;

    // Send the email using Resend API
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'RESEND_API_KEY is not configured. Email not sent.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'equipqr <no-reply@equipqr.app>',
        to: email,
        subject: `You've been invited to join ${organization_name} on equipqr`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: result
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Invitation email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
