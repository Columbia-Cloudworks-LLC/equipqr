
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { getTeamMembers } from './getTeamMembers';

interface OrgManager {
  user_id: string;
  role: string;
  display_name?: string;
  email?: string;
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
    
    // Get organization managers/owners
    const { data: orgManagersData, error: orgError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('org_id', team.org_id)
      .in('role', ['owner', 'manager']);
    
    if (orgError) {
      console.error('Error fetching org managers:', orgError);
      return teamMembers; // Return just team members if org query fails
    }
    
    if (!orgManagersData || orgManagersData.length === 0) {
      return teamMembers;
    }
    
    // Get user profiles for the org managers
    const managerUserIds = orgManagersData.map(m => m.user_id);
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', managerUserIds);
    
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      // Continue without profile data rather than failing completely
    }
    
    // Create a map of existing team member user IDs for deduplication
    const existingMemberUserIds = new Set(
      teamMembers
        .map(member => member.user_id)
        .filter(Boolean)
    );
    
    // Process org managers who aren't already team members
    const orgManagerMembers: TeamMember[] = orgManagersData
      .filter(manager => !existingMemberUserIds.has(manager.user_id))
      .map(manager => {
        const profile = userProfiles?.find(p => p.id === manager.user_id);
        
        return {
          id: `org-${manager.user_id}`, // Use a special ID prefix to identify org managers
          team_id: teamId,
          user_id: manager.user_id,
          auth_uid: manager.user_id, // For org managers, user_id is the auth_uid
          joined_at: new Date().toISOString(), // Use current time as placeholder
          display_name: profile?.display_name || 'Unknown Manager',
          email: '', // We don't have email access without admin API
          role: manager.role, // Use their org role as their effective team role
          status: 'Active', // Assume active since they have org roles
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
