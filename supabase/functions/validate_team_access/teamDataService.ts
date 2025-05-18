
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamData } from './interfaces.ts';

export class TeamDataService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get team details including organization name with proper UUID handling
   */
  async getTeamDetails(teamId: string): Promise<{ teamData: TeamData | null; orgName: string | null }> {
    try {
      const teamData = await this.getTeamData(teamId);
      
      if (!teamData) {
        return { teamData: null, orgName: null };
      }
      
      const orgName = await this.getOrgName(teamData.org_id);
      
      return {
        teamData: { 
          name: teamData.name, 
          org_id: teamData.org_id 
        },
        orgName
      };
    } catch (error) {
      console.error('Error getting team details:', error);
      return { teamData: null, orgName: null };
    }
  }

  /**
   * Get team data with proper UUID handling
   */
  async getTeamData(teamId: string): Promise<TeamData | null> {
    try {
      const { data: teamData } = await this.supabase
        .from('team')
        .select('name, org_id')
        .eq('id', teamId)
        .single();
      
      return teamData;
    } catch (error) {
      console.error('Error getting team data:', error);
      return null;
    }
  }

  /**
   * Get organization name with proper UUID handling
   */
  async getOrgName(orgId: string): Promise<string | null> {
    try {
      const { data: orgData } = await this.supabase
        .from('organization')
        .select('name')
        .eq('id', orgId)
        .single();
        
      return orgData ? orgData.name : null;
    } catch (error) {
      console.error('Error getting organization name:', error);
      return null;
    }
  }

  /**
   * Check if user is team creator with proper UUID handling
   */
  async isTeamCreator(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data: teamCreator } = await this.supabase
        .from('team')
        .select('created_by')
        .eq('id', teamId)
        .single();
      
      return teamCreator && teamCreator.created_by === userId;
    } catch (error) {
      console.error('Error checking if user is team creator:', error);
      return false;
    }
  }
}
