
// Create a client with admin privileges to bypass RLS
export async function createAdminClient() {
  // These env vars are automatically available when deployed
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for Supabase connection.');
  }
  
  // Import the Supabase client using ES modules
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  // Create admin client
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
