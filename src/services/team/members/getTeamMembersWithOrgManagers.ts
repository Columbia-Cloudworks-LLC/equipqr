
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { getTeamMembers } from './getTeamMembers';

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
    
    // Use the existing database function to get organization members with specific roles
    const { data: orgMembersData, error: orgError } = await supabase
      .rpc('get_organization_members', { org_id: team.org_id });
    
    if (orgError) {
      console.error('Error fetching org members:', orgError);
      return teamMembers; // Return just team members if org query fails
    }
    
    if (!orgMembersData || orgMembersData.length === 0) {
      return teamMembers;
    }
    
    // Create a map of existing team member user IDs for deduplication
    const existingMemberUserIds = new Set(
      teamMembers
        .map(member => [member.user_id, member.auth_uid])
        .flat()
        .filter(Boolean)
    );
    
    // Filter org members to only include managers/owners who aren't already team members
    const orgManagerMembers: TeamMember[] = orgMembersData
      .filter(orgMember => 
        ['owner', 'manager', 'admin'].includes(orgMember.role) && 
        !existingMemberUserIds.has(orgMember.user_id)
      )
      .map(orgMember => ({
        id: `org-${orgMember.user_id}`, // Use a special ID prefix to identify org managers
        team_id: teamId,
        user_id: orgMember.user_id,
        auth_uid: orgMember.user_id, // For org managers, user_id is the auth_uid
        joined_at: new Date().toISOString(), // Use current time as placeholder
        display_name: orgMember.name || 'Unknown Manager',
        email: orgMember.email || 'No email available',
        role: orgMember.role, // Use their org role as their effective team role
        status: 'Org Manager', // Clear status for org managers
        org_role: orgMember.role, // Store the original org role
        is_org_manager: true // Flag to identify these as org-level managers
      } as TeamMember & { org_role: string; is_org_manager: boolean }));
    
    // Now enhance existing team members with their organization roles
    const enhancedTeamMembers = await Promise.all(
      teamMembers.map(async (member) => {
        // Get organization role for this member
        const { data: orgRole, error: orgRoleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', member.auth_uid || member.user_id)
          .eq('org_id', team.org_id)
          .single();
        
        if (orgRoleError) {
          console.log(`No org role found for user ${member.auth_uid || member.user_id}:`, orgRoleError);
        }
        
        return {
          ...member,
          org_role: orgRole?.role || null,
          is_org_manager: false
        };
      })
    );
    
    // Combine team members with org managers, sorting so org managers appear after regular members
    const combinedMembers = [
      ...enhancedTeamMembers,
      ...orgManagerMembers
    ];
    
    console.log(`Combined ${enhancedTeamMembers.length} team members with ${orgManagerMembers.length} org managers`);
    
    return combinedMembers;
  } catch (error) {
    console.error('Error in getTeamMembersWithOrgManagers:', error);
    // Fallback to regular team members if anything goes wrong
    return getTeamMembers(teamId);
  }
}
