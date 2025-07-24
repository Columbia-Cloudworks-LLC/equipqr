import { corsHeaders } from '../_shared/cors.ts';

const HCAPTCHA_SECRET_KEY = Deno.env.get('HCAPTCHA_SECRET_KEY');

interface HCaptchaVerificationRequest {
  token: string;
  remoteip?: string;
}

interface HCaptchaVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!HCAPTCHA_SECRET_KEY) {
      console.error('HCAPTCHA_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { token, remoteip }: HCaptchaVerificationRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the token with hCaptcha
    const formData = new FormData();
    formData.append('secret', HCAPTCHA_SECRET_KEY);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const verificationResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result: HCaptchaVerificationResponse = await verificationResponse.json();

    console.log('hCaptcha verification result:', result);

    return new Response(
      JSON.stringify({ 
        success: result.success,
        error: result.success ? null : 'CAPTCHA verification failed'
      }),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Verification failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});