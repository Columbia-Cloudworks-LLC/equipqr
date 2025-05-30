
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
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
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { org_id } = await req.json()

    if (!org_id) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if organization has equipment
    const { count: equipmentCount, error: equipmentError } = await supabaseClient
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .is('deleted_at', null)

    if (equipmentError) {
      console.error('Error checking equipment:', equipmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to check equipment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasEquipment = (equipmentCount || 0) > 0

    // Get billable users count (exclude viewers)
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('org_id', org_id)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const billableUsersCount = userRoles?.filter(role => role.role !== 'viewer').length || 0

    // Check for active grace period
    const { data: billingInfo, error: billingError } = await supabaseClient
      .from('user_billing')
      .select('*')
      .eq('org_id', org_id)
      .single()

    let gracePeriodActive = false
    let gracePeriodEnd = null

    if (billingInfo && !billingError) {
      if (billingInfo.grace_period_end) {
        const gracePeriodEndDate = new Date(billingInfo.grace_period_end)
        gracePeriodActive = gracePeriodEndDate > new Date()
        gracePeriodEnd = billingInfo.grace_period_end
      }
    }

    const billingContext = {
      billing_required: hasEquipment,
      billable_users_count: billableUsersCount,
      has_equipment: hasEquipment,
      grace_period_active: gracePeriodActive,
      grace_period_end: gracePeriodEnd,
      monthly_cost_per_user: 10
    }

    return new Response(
      JSON.stringify(billingContext),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
