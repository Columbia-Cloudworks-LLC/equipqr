import { WorkOrderFormData } from './workOrderForm';
import { Equipment } from './equipment';

// Generic form field types
export interface FormFieldProps<T = any> {
  field: keyof T;
  value: any;
  onChange: (field: keyof T, value: any) => void;
  error?: string;
  disabled?: boolean;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormHeaderProps {
  isEditMode: boolean;
  preSelectedEquipment?: Equipment;
}

export interface HistoricalFieldsProps {
  values: Partial<WorkOrderFormData>;
  errors: Record<string, string>;
  setValue: (field: keyof WorkOrderFormData, value: any) => void;
}

export interface PMSectionProps {
  values: WorkOrderFormData;
  setValue: (field: keyof WorkOrderFormData, value: any) => void;
}

// Generic async operation result
export interface AsyncOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic error handling
export interface ErrorWithMessage {
  message: string;
}

export const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

export const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
};

export const getErrorMessage = (error: unknown): string => {
  return toErrorWithMessage(error).message;
};