
import { supabase } from '@/integrations/supabase/client';
import { authenticationService } from '@/services/auth/authenticationService';

/**
 * Permission validation service with enhanced security checks
 */
export class PermissionValidator {
  /**
   * Validate equipment access permissions
   */
  static async validateEquipmentAccess(
    equipmentId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { userId, error } = await authenticationService.getAuthenticatedUserId();
      
      if (error || !userId) {
        return { allowed: false, reason: 'Authentication required' };
      }

      // For now, use a simple check until we have the proper RPC function
      // This is a temporary fallback until the database function is implemented
      console.log('PermissionValidator: Equipment access check for:', equipmentId, 'action:', action);
      
      // Log the permission check attempt
      await this.logSecurityEvent(
        'equipment_permission_check',
        'equipment',
        equipmentId,
        {
          action,
          userId: userId.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        },
        'info'
      );

      return { allowed: true }; // Temporary fallback
    } catch (error) {
      console.error('Equipment access validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * Validate work order access permissions
   */
  static async validateWorkOrderAccess(
    equipmentId: string,
    action: 'view' | 'manage' | 'submit'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { userId, error } = await authenticationService.getAuthenticatedUserId();
      
      if (error || !userId) {
        return { allowed: false, reason: 'Authentication required' };
      }

      let functionName: string;
      switch (action) {
        case 'view':
          functionName = 'can_view_work_orders';
          break;
        case 'manage':
          functionName = 'can_manage_work_orders';
          break;
        case 'submit':
          functionName = 'can_submit_work_orders';
          break;
        default:
          return { allowed: false, reason: 'Invalid action' };
      }

      const { data, error: permissionError } = await supabase.rpc(functionName, {
        p_user_id: userId,
        p_equipment_id: equipmentId
      });

      if (permissionError) {
        console.error('Work order permission check error:', permissionError);
        return { allowed: false, reason: 'Permission check failed' };
      }

      return { allowed: !!data };
    } catch (error) {
      console.error('Work order access validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * Validate team access permissions
   */
  static async validateTeamAccess(
    teamId: string,
    requiredRoles?: string[]
  ): Promise<{ allowed: boolean; reason?: string; role?: string }> {
    try {
      const { userId, error } = await authenticationService.getAuthenticatedUserId();
      
      if (error || !userId) {
        return { allowed: false, reason: 'Authentication required' };
      }

      const { data, error: accessError } = await supabase.rpc(
        'check_team_access_detailed',
        {
          user_id: userId,
          team_id: teamId
        }
      );

      if (accessError) {
        console.error('Team access check error:', accessError);
        return { allowed: false, reason: 'Access check failed' };
      }

      if (!data || data.length === 0) {
        return { allowed: false, reason: 'No access data' };
      }

      const accessInfo = data[0];
      
      if (!accessInfo.has_access) {
        return { 
          allowed: false, 
          reason: accessInfo.access_reason || 'Access denied'
        };
      }

      // Check required roles if specified
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = accessInfo.team_role;
        if (!userRole || !requiredRoles.includes(userRole)) {
          return { 
            allowed: false, 
            reason: `Insufficient permissions. Required: ${requiredRoles.join(', ')}`,
            role: userRole
          };
        }
      }

      return { 
        allowed: true, 
        role: accessInfo.team_role 
      };
    } catch (error) {
      console.error('Team access validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * Enhanced rate limit check using new database function
   */
  static async checkRateLimit(
    identifier: string,
    attemptType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<{ allowed: boolean; attemptsRemaining: number; timeUntilReset: number; reason?: string }> {
    try {
      // Use the existing rate limit function that we know exists
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow but log the issue
        return { 
          allowed: true, 
          attemptsRemaining: maxAttempts, 
          timeUntilReset: 0,
          reason: 'Rate limit check failed'
        };
      }

      // Simple boolean response from existing function
      return {
        allowed: !!data,
        attemptsRemaining: data ? maxAttempts - 1 : 0,
        timeUntilReset: data ? 0 : windowMinutes * 60,
        reason: data ? undefined : 'Rate limit exceeded'
      };
    } catch (error) {
      console.error('Rate limit validation error:', error);
      return { 
        allowed: true, 
        attemptsRemaining: maxAttempts, 
        timeUntilReset: 0,
        reason: 'Validation error'
      };
    }
  }

  /**
   * Log security events using enhanced database function
   */
  static async logSecurityEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details ? JSON.stringify(details) : null
      });

      if (error) {
        console.error('Security event logging failed:', error);
      }
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }
}
