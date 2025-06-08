
import { useState, useCallback } from 'react';
import { InputValidation } from '@/services/security/InputValidation';
import { PermissionValidator } from '@/services/security/PermissionValidator';
import { SecurityAudit } from '@/services/security/SecurityAudit';
import { toast } from 'sonner';

/**
 * Secure equipment form handling with validation
 */
export function useSecureEquipmentForm() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateEquipmentData = useCallback((data: {
    name: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    location?: string;
    notes?: string;
  }) => {
    const errors: Record<string, string> = {};

    // Validate required fields
    const nameValidation = InputValidation.validateEquipmentName(data.name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.error!;
    }

    // Sanitize and validate optional fields
    if (data.manufacturer) {
      const sanitized = InputValidation.sanitizeText(data.manufacturer);
      if (!sanitized) {
        errors.manufacturer = 'Manufacturer contains invalid characters';
      }
    }

    if (data.model) {
      const sanitized = InputValidation.sanitizeText(data.model);
      if (!sanitized) {
        errors.model = 'Model contains invalid characters';
      }
    }

    if (data.serial_number) {
      const sanitized = InputValidation.sanitizeText(data.serial_number);
      if (!sanitized) {
        errors.serial_number = 'Serial number contains invalid characters';
      }
    }

    if (data.location) {
      const sanitized = InputValidation.sanitizeText(data.location);
      if (!sanitized) {
        errors.location = 'Location contains invalid characters';
      }
    }

    if (data.notes) {
      const sanitized = InputValidation.sanitizeText(data.notes);
      if (!sanitized) {
        errors.notes = 'Notes contain invalid characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const validateEquipmentAccess = useCallback(async (
    equipmentId: string,
    action: 'view' | 'edit' | 'delete'
  ) => {
    const result = await PermissionValidator.validateEquipmentAccess(equipmentId, action);
    
    if (!result.allowed) {
      toast.error('Access denied', { description: result.reason });
      await SecurityAudit.logSecurityEvent('access_denied', 'equipment', equipmentId, {
        action,
        reason: result.reason
      });
      return false;
    }

    await SecurityAudit.logEquipmentAccess(action, equipmentId);
    return true;
  }, []);

  const sanitizeEquipmentData = useCallback((data: any) => {
    return {
      ...data,
      name: InputValidation.sanitizeText(data.name),
      manufacturer: InputValidation.sanitizeText(data.manufacturer),
      model: InputValidation.sanitizeText(data.model),
      serial_number: InputValidation.sanitizeText(data.serial_number),
      location: InputValidation.sanitizeText(data.location),
      notes: InputValidation.sanitizeText(data.notes)
    };
  }, []);

  return {
    validateEquipmentData,
    validateEquipmentAccess,
    sanitizeEquipmentData,
    validationErrors,
    clearValidationErrors: () => setValidationErrors({})
  };
}
