
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamData } from './interfaces.ts';

/**
 * Service for fetching team-related data
 */
export class TeamDataService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get team data
   */
  async getTeamData(teamId: string): Promise<TeamData | null> {
    const { data: teamData } = await this.supabase
      .from('team')
      .select('name, org_id')
      .eq('id', teamId)
      .single();
    
    return teamData;
  }

  /**
   * Get organization name
   */
  async getOrgName(orgId: string): Promise<string | null> {
    const { data: orgData } = await this.supabase
      .from('organization')
      .select('name')
      .eq('id', orgId)
      .single();
      
    return orgData ? orgData.name : null;
  }

  /**
   * Check if user is team creator
   */
  async isTeamCreator(userId: string, teamId: string): Promise<boolean> {
    const { data: teamCreator } = await this.supabase
      .from('team')
      .select('created_by')
      .eq('id', teamId)
      .single();
    
    return teamCreator && teamCreator.created_by === userId;
  }
}
