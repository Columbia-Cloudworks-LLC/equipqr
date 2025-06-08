
import { useState, useCallback } from 'react';
import { InputValidation } from '@/services/security/InputValidation';
import { PermissionValidator } from '@/services/security/PermissionValidator';
import { SecurityAudit } from '@/services/security/SecurityAudit';
import { toast } from 'sonner';

/**
 * Secure work notes handling with validation
 */
export function useSecureWorkNotes() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateWorkNoteData = useCallback((data: {
    note: string;
    hours_worked?: number | null;
    equipment_id: string;
  }) => {
    const errors: Record<string, string> = {};

    // Validate note content
    const noteValidation = InputValidation.validateWorkNote(data.note);
    if (!noteValidation.valid) {
      errors.note = noteValidation.error!;
    }

    // Validate hours worked
    const hoursValidation = InputValidation.validateHoursWorked(data.hours_worked);
    if (!hoursValidation.valid) {
      errors.hours_worked = hoursValidation.error!;
    }

    // Validate equipment ID format
    if (!InputValidation.validateUUID(data.equipment_id)) {
      errors.equipment_id = 'Invalid equipment ID format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const validateWorkOrderAccess = useCallback(async (
    equipmentId: string,
    action: 'view' | 'manage' | 'submit'
  ) => {
    const result = await PermissionValidator.validateWorkOrderAccess(equipmentId, action);
    
    if (!result.allowed) {
      toast.error('Access denied', { description: result.reason });
      await SecurityAudit.logSecurityEvent('access_denied', 'work_order', equipmentId, {
        action,
        reason: result.reason
      });
      return false;
    }

    return true;
  }, []);

  const sanitizeWorkNoteData = useCallback((data: any) => {
    return {
      ...data,
      note: InputValidation.sanitizeText(data.note)
    };
  }, []);

  return {
    validateWorkNoteData,
    validateWorkOrderAccess,
    sanitizeWorkNoteData,
    validationErrors,
    clearValidationErrors: () => setValidationErrors({})
  };
}
