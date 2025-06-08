
/**
 * Client-side input validation and sanitization utilities
 * Works in conjunction with database-level validation triggers
 */
export class InputValidation {
  /**
   * Validate email format (client-side check before submission)
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && 
           email.length <= 320 && 
           email.split('@')[0].length <= 64 && 
           email.split('@')[1].length <= 253;
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize text input (basic XSS prevention)
   */
  static sanitizeText(input: string | null): string | null {
    if (!input) return null;
    
    return input
      .substring(0, 10000) // Limit length
      .replace(/[<>"'&]/g, '') // Remove dangerous HTML chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Validate equipment name
   */
  static validateEquipmentName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Equipment name cannot be empty' };
    }
    
    const sanitized = this.sanitizeText(name);
    if (!sanitized || sanitized.length === 0) {
      return { valid: false, error: 'Equipment name contains invalid characters' };
    }
    
    return { valid: true };
  }

  /**
   * Validate work note content
   */
  static validateWorkNote(note: string): { valid: boolean; error?: string } {
    if (!note || note.trim() === '') {
      return { valid: false, error: 'Work note content cannot be empty' };
    }
    
    const sanitized = this.sanitizeText(note);
    if (!sanitized || sanitized.length === 0) {
      return { valid: false, error: 'Work note contains invalid characters' };
    }
    
    return { valid: true };
  }

  /**
   * Validate hours worked
   */
  static validateHoursWorked(hours: number | null): { valid: boolean; error?: string } {
    if (hours === null || hours === undefined) {
      return { valid: true }; // Optional field
    }
    
    if (hours < 0 || hours > 24) {
      return { valid: false, error: 'Hours worked must be between 0 and 24' };
    }
    
    return { valid: true };
  }

  /**
   * Validate team name
   */
  static validateTeamName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Team name cannot be empty' };
    }
    
    const sanitized = this.sanitizeText(name);
    if (!sanitized || sanitized.length === 0) {
      return { valid: false, error: 'Team name contains invalid characters' };
    }
    
    return { valid: true };
  }
}
