
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Database-first permission check fallback when edge functions aren't available
 */
export async function fallbackPermissionCheck(
  authUserId: string, 
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  try {
    console.log('Using fallback permission check function', {
      authUserId,
      teamId,
      orgId
    });
    
    // If orgId is explicitly provided, check if user has permission in that org
    if (orgId) {
      console.log(`Checking explicit org_id permission: ${orgId}`);
      const { data, error } = await supabase.rpc('simplified_equipment_create_permission', {
        p_user_id: authUserId,
        p_team_id: null,
        p_org_id: orgId
      });
      
      if (error) throw error;
      
      const hasAccess = data && data.can_create;
      
      if (hasAccess) {
        return {
          authUserId,
          teamId: null,
          orgId,
          hasPermission: true,
          reason: 'explicit_org' 
        };
      } else {
        throw new Error(`You don't have permission to create equipment in this organization`);
      }
    }
    
    // If team is provided, check team-based permission
    if (teamId) {
      // Check direct database function
      const { data, error } = await supabase.rpc('can_create_equipment_safe', {
        p_user_id: authUserId,
        p_team_id: teamId
      });
      
      if (error) {
        console.error('Error checking team permission:', error);
        throw new Error('Failed to check team permission');
      }
      
      if (!data) {
        throw new Error('You don\'t have permission to create equipment for this team');
      }
      
      // Get the organization ID for this team
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        throw new Error('Failed to fetch team information');
      }
      
      return {
        authUserId,
        teamId,
        orgId: teamData.org_id,
        hasPermission: true,
        reason: 'team_permission'
      };
    }
    
    // If no team or org provided, use user's default org
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user organization');
    }
    
    return {
      authUserId,
      teamId: null,
      orgId: profileData.org_id,
      hasPermission: true,
      reason: 'default_org'
    };
  } catch (error: any) {
    console.error('Error in fallbackPermissionCheck:', error);
    throw error;
  }
}

/**
 * Direct database permission check (most reliable but slowest)
 */
export async function directDatabasePermissionCheck(
  authUserId: string, 
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  try {
    console.log('Using direct database permission check', {
      authUserId,
      teamId,
      orgId
    });
    
    const { data, error } = await supabase.rpc('check_equipment_create_permission', {
      p_user_id: authUserId,
      p_team_id: teamId || null,
      p_org_id: orgId || null
    });
    
    if (error) {
      console.error('Database permission check error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    if (!data?.[0]) {
      throw new Error('Permission check returned no data');
    }
    
    const result = data[0];
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: result.org_id || orgId || null,
      hasPermission: result.has_permission || false,
      reason: result.reason || 'unknown'
    };
  } catch (error: any) {
    console.error('Error in directDatabasePermissionCheck:', error);
    throw error;
  }
}
