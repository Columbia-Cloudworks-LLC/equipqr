
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.37.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the Auth context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email from request body or from session
    let email = session.user.email?.toLowerCase()
    let orgId = null
    
    // Parse request body if present
    if (req.method === 'POST') {
      const body = await req.json()
      email = body.email?.toLowerCase() || email
      orgId = body.org_id || null
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'No email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Checking invitation status for email: ${email}`)
    
    // Query for pending organization invitations
    let query = supabase
      .from('organization_invitations')
      .select('id, email, status, role, org_id, created_at')
      .eq('email', email)
    
    // Add org_id filter if provided  
    if (orgId) {
      query = query.eq('org_id', orgId)
    }
    
    const { data: invites, error } = await query
    
    if (error) {
      console.error('Error fetching invitations:', error)
      return new Response(
        JSON.stringify({ error: `Failed to fetch invitations: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Count the statuses for debugging
    const statusCounts = invites.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1
      return acc
    }, {})

    console.log(`Found ${invites.length} invitations for ${email}`)
    console.log(`Status counts: ${JSON.stringify(statusCounts)}`)

    // Return the invitations
    return new Response(
      JSON.stringify({ 
        invitations: invites,
        statusCounts,
        count: invites.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
