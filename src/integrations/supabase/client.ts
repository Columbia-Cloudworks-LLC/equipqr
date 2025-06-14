
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ApiConfig, AppConfig } from '@/config/app';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  ApiConfig.supabase.url,
  ApiConfig.supabase.anonKey,
  {
    auth: {
      storage: localStorage, // Use direct localStorage for simplicity and reliability
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true // Enable debug mode for better logging
    },
    global: {
      headers: {
        'x-client-info': `${AppConfig.name.toLowerCase()}-web@${AppConfig.build.date}`
      }
    }
  }
);

// Set up auth event listener outside the client creation
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Client: Auth state change detected:', event);
  if (event === 'SIGNED_OUT') {
    console.log('Client: User signed out, clearing local storage');
  }
});
