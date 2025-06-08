
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

      const { data, error } = await supabase.rpc('check_equipment_permissions', {
        _user_id: userId,
        _equipment_id: equipmentId,
        _action: action
      });

      if (error) {
        console.error('Permission check error:', error);
        return { allowed: false, reason: 'Permission check failed' };
      }

      return { allowed: data === true };
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

      const { data, error } = await supabase.rpc('can_access_team', {
        p_uid: userId,
        p_team_id: teamId
      });

      if (error) {
        console.error('Team access check error:', error);
        return { allowed: false, reason: 'Access check failed' };
      }

      return { allowed: data === true };
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

      let rpcFunction: string;
      switch (action) {
        case 'view':
          rpcFunction = 'can_view_work_orders';
          break;
        case 'manage':
          rpcFunction = 'can_manage_work_orders';
          break;
        case 'submit':
          rpcFunction = 'can_submit_work_orders';
          break;
        default:
          return { allowed: false, reason: 'Invalid action' };
      }

      const { data, error } = await supabase.rpc(rpcFunction, {
        p_user_id: userId,
        p_equipment_id: equipmentId
      });

      if (error) {
        console.error('Work order permission check error:', error);
        return { allowed: false, reason: 'Permission check failed' };
      }

      return { allowed: data === true };
    } catch (error) {
      console.error('Work order permission validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }
}
