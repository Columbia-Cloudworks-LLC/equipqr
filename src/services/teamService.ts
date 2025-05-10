
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";

export async function getTeamMembers() {
  // First get the organization ID for the current user
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id')
    .single();
    
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw profileError;
  }
  
  const orgId = userProfile.org_id;
  
  // Now get all users in this organization with their roles using our custom function
  const { data, error } = await supabase
    .rpc('get_organization_members', { org_id: orgId });
    
  if (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
  
  return data as TeamMember[];
}

export async function inviteMember(email: string, role: string) {
  // This will be implemented later with serverside function
  // For now we'll use a placeholder implementation
  console.log(`Inviting ${email} with role ${role}`);
  return { success: true };
}

export async function changeRole(userId: string, role: UserRole) {
  // First get the organization ID for the current user
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id')
    .single();
    
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw profileError;
  }
  
  const orgId = userProfile.org_id;
  
  // Update the user's role
  const { error } = await supabase
    .from('user_roles')
    .update({ role })
    .match({ user_id: userId, org_id: orgId });
    
  if (error) {
    console.error('Error updating role:', error);
    throw error;
  }
  
  return { success: true };
}

export async function removeMember(userId: string) {
  // First get the organization ID for the current user
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id')
    .single();
    
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw profileError;
  }
  
  const orgId = userProfile.org_id;
  
  // Remove the user from the organization
  // This is a placeholder - in a real app we would have a more complex flow
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .match({ user_id: userId, org_id: orgId });
    
  if (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
  
  return { success: true };
}

export async function resendInvite(userId: string) {
  // Placeholder for resending an invitation
  console.log(`Resending invitation to user ${userId}`);
  return { success: true };
}
