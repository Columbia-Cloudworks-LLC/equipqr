
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced permission validation utility
 */
export class PermissionValidator {
  /**
   * Validate user can access equipment
   */
  static async validateEquipmentAccess(
    equipmentId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // Use direct SQL query instead of RPC for equipment permissions
      const { data, error } = await supabase
        .from('equipment')
        .select('id, organization_id, team_id')
        .eq('id', equipmentId)
        .single();

      if (error) {
        console.error('Equipment access check error:', error);
        return { allowed: false, reason: 'Equipment not found' };
      }

      // For now, allow access if user is authenticated
      // This should be enhanced with proper permission checking
      return { allowed: true };
    } catch (error) {
      console.error('Permission validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * Validate user can access team
   */
  static async validateTeamAccess(teamId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // Check if user is a member of the team
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Team access check error:', error);
        return { allowed: false, reason: 'Access check failed' };
      }

      return { allowed: !!data };
    } catch (error) {
      console.error('Team access validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * Validate user can manage work orders
   */
  static async validateWorkOrderAccess(
    equipmentId: string,
    action: 'view' | 'manage' | 'submit'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // First check if user can access the equipment
      const equipmentAccess = await this.validateEquipmentAccess(equipmentId, 'view');
      if (!equipmentAccess.allowed) {
        return equipmentAccess;
      }

      // For now, allow work order access if equipment access is allowed
      // This should be enhanced with role-based checking
      return { allowed: true };
    } catch (error) {
      console.error('Work order permission validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }
}
