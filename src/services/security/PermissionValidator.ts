
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

      // Get equipment details
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, org_id, team_id')
        .eq('id', equipmentId)
        .maybeSingle();

      if (equipmentError) {
        console.error('Equipment access check error:', equipmentError);
        return { allowed: false, reason: 'Equipment not found' };
      }

      if (!equipment) {
        return { allowed: false, reason: 'Equipment not found' };
      }

      // Use the database function for permission checking
      const { data: hasPermission, error: permissionError } = await supabase.rpc(
        'check_equipment_permissions',
        {
          _user_id: userId,
          _equipment_id: equipmentId,
          _action: action
        }
      );

      if (permissionError) {
        console.error('Permission check error:', permissionError);
        return { allowed: false, reason: 'Permission check failed' };
      }

      return { allowed: hasPermission === true };
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

      // Use the database function for team access checking
      const { data: hasAccess, error } = await supabase.rpc(
        'can_access_team',
        {
          p_uid: userId,
          p_team_id: teamId
        }
      );

      if (error) {
        console.error('Team access check error:', error);
        return { allowed: false, reason: 'Access check failed' };
      }

      return { allowed: hasAccess === true };
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

      // Use explicit function calls based on action to avoid TypeScript errors
      let hasPermission: boolean = false;
      let error: any = null;

      if (action === 'view') {
        const { data, error: viewError } = await supabase.rpc(
          'can_view_work_orders',
          {
            p_user_id: userId,
            p_equipment_id: equipmentId
          }
        );
        hasPermission = data === true;
        error = viewError;
      } else if (action === 'manage') {
        const { data, error: manageError } = await supabase.rpc(
          'can_manage_work_orders',
          {
            p_user_id: userId,
            p_equipment_id: equipmentId
          }
        );
        hasPermission = data === true;
        error = manageError;
      } else if (action === 'submit') {
        const { data, error: submitError } = await supabase.rpc(
          'can_submit_work_orders',
          {
            p_user_id: userId,
            p_equipment_id: equipmentId
          }
        );
        hasPermission = data === true;
        error = submitError;
      } else {
        return { allowed: false, reason: 'Invalid action' };
      }

      if (error) {
        console.error('Work order permission check error:', error);
        return { allowed: false, reason: 'Permission check failed' };
      }

      return { allowed: hasPermission };
    } catch (error) {
      console.error('Work order permission validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }
}
