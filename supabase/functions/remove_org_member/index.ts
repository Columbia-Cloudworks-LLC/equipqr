
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let requestBody;
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { org_id, user_id } = requestBody

    if (!org_id || !user_id) {
      console.error('Missing required parameters:', { org_id, user_id })
      return new Response(
        JSON.stringify({ error: 'Missing org_id or user_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log(`Attempting to remove user ${user_id} from organization ${org_id} by ${user.id}`)

    // Validate that the organization exists and user has permission
    const { data: orgCheck, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .single()

    if (orgError || !orgCheck) {
      console.error('Organization not found or error:', orgError)
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Call the database function to remove the organization member
    const { data, error } = await supabaseClient.rpc('remove_organization_member', {
      p_org_id: org_id,
      p_user_id: user_id,
      p_removed_by: user.id
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Database operation failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!data || !data.success) {
      const errorMsg = data?.error || 'Unknown database error'
      console.error('Database function returned error:', errorMsg)
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log(`Successfully removed user from organization. Teams removed: ${data.teams_removed}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: data.message || 'Member removed successfully',
        teams_removed: data.teams_removed || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error?.message || 'Unknown error') }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
