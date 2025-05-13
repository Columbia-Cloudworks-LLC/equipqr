
// Helper to create Supabase admin client for edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create a Supabase client with the service role key
  return createClient(supabaseUrl, supabaseServiceKey);
}
