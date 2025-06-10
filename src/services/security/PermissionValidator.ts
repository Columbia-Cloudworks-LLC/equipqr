
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

      const { data, error: permissionError } = await supabase.rpc(
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

      return { allowed: !!data };
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
      const { data, error } = await supabase.rpc('check_enhanced_rate_limit', {
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

      // Type-safe parsing of the JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        allowed: !!result.allowed,
        attemptsRemaining: result.attempts_remaining || 0,
        timeUntilReset: result.time_until_reset || 0,
        reason: result.reason
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
      const { error } = await supabase.rpc('log_security_event_enhanced', {
        p_event_type: eventType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details ? JSON.stringify(details) : null,
        p_severity: severity
      });

      if (error) {
        console.error('Security event logging failed:', error);
      }
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }
}
