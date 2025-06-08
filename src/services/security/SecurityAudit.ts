
import { supabase } from '@/integrations/supabase/client';

/**
 * Security audit logging utility
 */
export class SecurityAudit {
  /**
   * Log a security event
   */
  static async logSecurityEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details ? JSON.stringify(details) : null
      });

      if (error) {
        console.error('Security audit logging failed:', error);
      }
    } catch (error) {
      console.error('Security audit error:', error);
    }
  }

  /**
   * Log authentication event
   */
  static async logAuthEvent(
    eventType: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'signup_attempt' | 'signup_success' | 'signup_failure',
    email?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent(eventType, 'auth', 'system', {
      email: email?.substring(0, 3) + '***', // Obfuscate for privacy
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100),
      ...details
    });
  }

  /**
   * Log equipment access event
   */
  static async logEquipmentAccess(
    eventType: 'view' | 'edit' | 'delete' | 'create',
    equipmentId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent(`equipment_${eventType}`, 'equipment', equipmentId, details);
  }

  /**
   * Log team access event
   */
  static async logTeamAccess(
    eventType: 'view' | 'join' | 'leave' | 'create',
    teamId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent(`team_${eventType}`, 'team', teamId, details);
  }
}
