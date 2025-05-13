
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Creates a Supabase admin client with service role permissions
 * This bypasses RLS and allows for direct operations
 * Only use this when you need to perform operations that require admin access
 */
export async function createAdminClient(): Promise<SupabaseClient> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}
