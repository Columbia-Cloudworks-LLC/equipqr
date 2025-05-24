
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { getTeamMembers } from './getTeamMembers';

interface OrgManager {
  id: string;
  user_id: string;
  auth_uid: string;
  display_name: string;
  email: string;
  role: string;
  status: string;
  org_role: string;
  is_org_manager: boolean;
}

/**
 * Get team members enhanced with organization managers who aren't already team members
 * This provides transparency about who has management authority over the team
 */
export async function getTeamMembersWithOrgManagers(teamId: string): Promise<TeamMember[]> {
  try {
    console.log(`Fetching team members with org managers for team ${teamId}`);
    
    // Get regular team members first
    const teamMembers = await getTeamMembers(teamId);
    
    // Get the team's organization ID
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      console.error('Error fetching team organization:', teamError);
      return teamMembers; // Return just team members if we can't get org info
    }
    
    // Get organization managers/owners who aren't already team members
    const { data: orgManagers, error: orgError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        user_profiles!inner(
          id,
          display_name,
          org_id
        )
      `)
      .eq('org_id', team.org_id)
      .in('role', ['owner', 'manager'])
      .eq('user_profiles.org_id', team.org_id);
    
    if (orgError) {
      console.error('Error fetching org managers:', orgError);
      return teamMembers; // Return just team members if org query fails
    }
    
    if (!orgManagers || orgManagers.length === 0) {
      return teamMembers;
    }
    
    // Get auth user data for org managers
    const managerUserIds = orgManagers.map(m => m.user_id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return teamMembers;
    }
    
    // Create a map of existing team member auth UIDs for deduplication
    const existingMemberAuthUids = new Set(
      teamMembers
        .map(member => member.auth_uid)
        .filter(Boolean)
    );
    
    // Process org managers who aren't already team members
    const orgManagerMembers: TeamMember[] = orgManagers
      .filter(manager => {
        const authUser = authUsers.users.find(u => u.id === manager.user_id);
        return authUser && !existingMemberAuthUids.has(authUser.id);
      })
      .map(manager => {
        const authUser = authUsers.users.find(u => u.id === manager.user_id);
        const profile = manager.user_profiles;
        
        return {
          id: `org-${manager.user_id}`, // Use a special ID prefix to identify org managers
          team_id: teamId,
          user_id: manager.user_id,
          auth_uid: authUser?.id || '',
          joined_at: new Date().toISOString(), // Use current time as placeholder
          display_name: profile?.display_name || authUser?.email?.split('@')[0] || 'Unknown',
          email: authUser?.email || '',
          role: manager.role, // Use their org role as their effective team role
          status: authUser?.last_sign_in_at ? 'Active' : 'Pending',
          org_role: manager.role, // Store the original org role
          is_org_manager: true // Flag to identify these as org-level managers
        } as TeamMember & { org_role: string; is_org_manager: boolean };
      });
    
    // Combine team members with org managers, sorting so org managers appear after regular members
    const combinedMembers = [
      ...teamMembers,
      ...orgManagerMembers
    ];
    
    console.log(`Combined ${teamMembers.length} team members with ${orgManagerMembers.length} org managers`);
    
    return combinedMembers;
  } catch (error) {
    console.error('Error in getTeamMembersWithOrgManagers:', error);
    // Fallback to regular team members if anything goes wrong
    return getTeamMembers(teamId);
  }
}
