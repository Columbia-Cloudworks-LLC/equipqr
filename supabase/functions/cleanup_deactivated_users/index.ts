
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting cleanup of deactivated users...');

    // Find users whose reactivation deadline has passed
    const { data: expiredUsers, error: expiredUsersError } = await supabase
      .from('user_profiles')
      .select('id, org_id, reactivation_deadline')
      .eq('is_deactivated', true)
      .not('reactivation_deadline', 'is', null)
      .lt('reactivation_deadline', new Date().toISOString());

    if (expiredUsersError) {
      console.error('Error fetching expired users:', expiredUsersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired users' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredUsers?.length || 0} expired users`);

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired users found', processedCount: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    const results = [];

    for (const user of expiredUsers) {
      try {
        // Check if this user was the only manager in their org
        const { data: isOnlyManager, error: managerCheckError } = await supabase
          .rpc('is_only_manager_in_org', {
            p_user_id: user.id,
            p_org_id: user.org_id
          });

        if (managerCheckError) {
          console.error(`Error checking manager status for user ${user.id}:`, managerCheckError);
          results.push({ userId: user.id, status: 'error', error: managerCheckError.message });
          continue;
        }

        if (isOnlyManager) {
          // Organization should already be soft-deleted, but ensure it's marked as deleted
          const { error: deleteOrgError } = await supabase
            .rpc('soft_delete_organization', { p_org_id: user.org_id });

          if (deleteOrgError) {
            console.error(`Error deleting organization for user ${user.id}:`, deleteOrgError);
            results.push({ userId: user.id, status: 'error', error: deleteOrgError.message });
            continue;
          }
        }

        // Clear reactivation deadline to indicate permanent deactivation
        const { error: clearDeadlineError } = await supabase
          .from('user_profiles')
          .update({ reactivation_deadline: null })
          .eq('id', user.id);

        if (clearDeadlineError) {
          console.error(`Error clearing deadline for user ${user.id}:`, clearDeadlineError);
          results.push({ userId: user.id, status: 'error', error: clearDeadlineError.message });
          continue;
        }

        processedCount++;
        results.push({ userId: user.id, status: 'processed' });
        console.log(`Processed user ${user.id}`);

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({ userId: user.id, status: 'error', error: error.message });
      }
    }

    console.log(`Cleanup completed. Processed ${processedCount} users.`);

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed', 
        processedCount,
        totalExpired: expiredUsers.length,
        results 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup_deactivated_users function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
