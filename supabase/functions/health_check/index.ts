
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Create a Supabase client
function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const checks = [];
    let statusCode = 200;
    
    // Test basic database connection
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('team').select('count').limit(1);
      const duration = Date.now() - start;
      
      checks.push({
        name: 'Database Connection',
        status: error ? 'failed' : 'ok',
        duration: `${duration}ms`,
        error: error ? error.message : null,
      });
      
      if (error) statusCode = 500;
    } catch (e) {
      checks.push({
        name: 'Database Connection',
        status: 'error',
        error: e.message,
      });
      statusCode = 500;
    }
    
    // Test validate_team_access_with_org function
    try {
      const { data: users } = await supabase.auth.admin.listUsers({ limit: 1 });
      if (users?.users?.length > 0) {
        const userId = users.users[0].id;
        const { data: teams } = await supabase.from('team').select('id').limit(1);
        
        if (teams && teams.length > 0) {
          const teamId = teams[0].id;
          const start = Date.now();
          const { data, error } = await supabase.rpc('validate_team_access_with_org', {
            p_user_id: userId, 
            p_team_id: teamId
          });
          const duration = Date.now() - start;
          
          checks.push({
            name: 'validate_team_access_with_org Function',
            status: error ? 'failed' : 'ok',
            duration: `${duration}ms`,
            error: error ? error.message : null,
          });
          
          if (error) statusCode = 500;
        }
      }
    } catch (e) {
      checks.push({
        name: 'validate_team_access_with_org Function',
        status: 'error',
        error: e.message,
      });
      statusCode = 500;
    }
    
    // Return health check results
    return new Response(
      JSON.stringify({
        status: statusCode === 200 ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
