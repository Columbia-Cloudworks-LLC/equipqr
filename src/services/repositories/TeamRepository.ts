import { 
  getOrganizationTeamsOptimized, 
  getTeamMembersOptimized, 
  isTeamManager as isTeamManagerOptimized,
  OptimizedTeam,
  OptimizedTeamMember 
} from '@/services/optimizedTeamService';
import { TeamWithMembers } from '@/services/teamService';
import { 
  addTeamMember, 
  updateTeamMemberRole, 
  createTeamWithCreator as createTeamWithCreatorService,
  deleteTeam as deleteTeamService,
  updateTeam as updateTeamService
} from '@/services/teamService';
import { Database } from '@/integrations/supabase/types';

type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberRole = Database['public']['Enums']['team_member_role'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type TeamUpdate = Database['public']['Tables']['teams']['Update'];

/**
 * Unified Team Repository using optimized queries for better performance
 * Provides a single interface for all team-related operations
 */
export class TeamRepository {
  /**
   * Get teams by organization ID using optimized query with member counts
   * Converts OptimizedTeam to TeamWithMembers format for compatibility
   */
  static async getTeamsByOrg(orgId: string): Promise<TeamWithMembers[]> {
    const optimizedTeams = await getOrganizationTeamsOptimized(orgId);
    // Convert OptimizedTeam to TeamWithMembers format for compatibility
    return optimizedTeams.map(team => ({
      ...team,
      members: [], // Members will be loaded separately when needed
      member_count: team.member_count
    }));
  }

  /**
   * Get team members with profile information using optimized query
   */
  static async getTeamMembers(teamId: string): Promise<OptimizedTeamMember[]> {
    return getTeamMembersOptimized(teamId);
  }

  /**
   * Add a member to a team with specified role
   */
  static async addMember(teamId: string, userId: string, role: TeamMemberRole) {
    const memberData: TeamMemberInsert = {
      team_id: teamId,
      user_id: userId,
      role: role
    };
    return addTeamMember(memberData);
  }

  /**
   * Update a team member's role
   */
  static async updateMemberRole(teamId: string, userId: string, role: TeamMemberRole) {
    return updateTeamMemberRole(teamId, userId, role);
  }

  /**
   * Check if a user is a team manager using optimized query
   */
  static async isTeamManager(userId: string, teamId: string): Promise<boolean> {
    return isTeamManagerOptimized(userId, teamId);
  }

  /**
   * Create a team with creator as manager
   */
  static async createTeamWithCreator(teamData: TeamInsert, creatorId: string) {
    return createTeamWithCreatorService(teamData, creatorId);
  }

  /**
   * Delete a team
   */
  static async deleteTeam(teamId: string): Promise<void> {
    return deleteTeamService(teamId);
  }

  /**
   * Update team information
   */
  static async updateTeam(teamId: string, updates: TeamUpdate) {
    return updateTeamService(teamId, updates);
  }
}

export default TeamRepository;