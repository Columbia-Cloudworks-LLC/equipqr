
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase admin client for database operations with full access
 */
export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for Supabase admin client');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'edge-function:get-dashboard-data'
      }
    }
  });
}
