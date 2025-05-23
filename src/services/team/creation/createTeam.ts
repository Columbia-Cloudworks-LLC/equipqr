
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";
import { toast } from "sonner";

/**
 * Create a new team
 */
export async function createTeam(name: string, orgId: string) {
  try {
    console.log(`Creating new team: ${name} in organization: ${orgId}`);
    
    // Get the current user's ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create a team');
    }
    
    // Get the auth user ID
    const authUserId = sessionData.session.user.id;
    console.log(`Auth user ID: ${authUserId}`);
    
    // Get the corresponding app_user.id for the auth user
    let appUserId = await getAppUserId(authUserId);
    
    // If appUserId is null, try a direct fallback query
    if (!appUserId) {
      console.log('Primary app_user ID lookup failed, trying fallback lookup...');
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', authUserId)
        .maybeSingle();
      
      if (appUserError) {
        console.error('Fallback app_user query error:', appUserError);
      } else if (appUserData) {
        appUserId = appUserData.id;
        console.log(`Fallback found app_user.id: ${appUserId}`);
      }
    }
    
    // Final check to ensure we have an app_user ID
    if (!appUserId) {
      console.error(`Cannot find app_user record for auth_uid: ${authUserId}`);
      throw new Error('User account not properly set up. Please try logging out and back in.');
    }
    
    // Validate the organization exists before attempting to create a team
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('id')
      .eq('id', orgId)
      .single();
      
    if (orgError || !orgData) {
      console.error('Organization validation error:', orgError);
      throw new Error(`Invalid organization ID: ${orgId}. Organization might not exist.`);
    }
    
    console.log(`Organization validated: ${orgId}`);
    console.log(`Using app_user ID for team creation: ${appUserId}`);
    
    // Create the team
    const { data, error } = await supabase
      .from('team')
      .insert({
        name,
        org_id: orgId,
        created_by: appUserId // Use the app_user.id instead of the auth.uid
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating team:', error);
      
      // Provide more specific error messages based on error codes
      if (error.code === '23503') { // Foreign key violation
        if (error.details?.includes('created_by')) {
          throw new Error(`User ID mismatch. Please try logging out and back in.`);
        } else if (error.details?.includes('org_id')) {
          throw new Error(`Organization with ID ${orgId} does not exist.`);
        }
      }
      
      throw error;
    }
    
    console.log(`Team created successfully with ID: ${data.id}`);
    
    // Add the creator as a team member with 'manager' role
    try {
      // Use the add_team_member edge function
      const { data: memberData, error: memberError } = await supabase.functions.invoke('add_team_member', {
        body: {
          _team_id: data.id,
          _user_id: authUserId, // Use auth user ID here as the edge function expects it
          _role: 'manager',
          _added_by: authUserId // Use auth user ID here as the edge function expects it
        }
      });
      
      if (memberError) {
        console.error('Error adding creator to team:', memberError);
        
        // Try to delete the team if adding the member failed
        const { error: deleteError } = await supabase
          .from('team')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          console.error('Error deleting team after membership creation failure:', deleteError);
          // This leaves an "orphaned" team in the database, but we alert the user
          throw new Error('Team was created but you could not be added as a member. Please contact support.');
        } else {
          throw new Error('Failed to add you as a team member. Team creation was rolled back.');
        }
      }
      
      // Additional verification to ensure team member was actually added
      const { data: verifyMember, error: verifyError } = await supabase.functions.invoke('validate_team_access', {
        body: {
          team_id: data.id,
          user_id: authUserId
        }
      });
      
      if (verifyError || !verifyMember?.is_member) {
        console.error('Team member verification failed:', verifyError || 'Not a team member');
        throw new Error('Team was created but your membership could not be verified. Please try to repair the team.');
      }
      
      console.log('Team created successfully with member:', memberData);
      
    } catch (memberError) {
      console.error('Error adding creator to team:', memberError);
      throw new Error(`Team created, but failed to add you as a member: ${memberError.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
}
