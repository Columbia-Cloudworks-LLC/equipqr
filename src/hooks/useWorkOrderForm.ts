import { useEffect } from 'react';
import { z } from 'zod';
import { useFormValidation } from '@/hooks/useFormValidation';
import { EnhancedWorkOrder } from '@/services/workOrderDataService';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional().nullable(),
  equipmentWorkingHours: z.number().min(0).optional(),
  hasPM: z.boolean().default(false),
  assignmentType: z.enum(['unassigned', 'user', 'team']).optional(),
  assignmentId: z.string().optional(),
  isHistorical: z.boolean().default(false),
  // Historical fields
  status: z.enum(['submitted', 'accepted', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  historicalStartDate: z.date().optional(),
  historicalNotes: z.string().optional(),
  completedDate: z.date().optional().nullable(),
});

export type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface UseWorkOrderFormProps {
  workOrder?: EnhancedWorkOrder;
  equipmentId?: string;
  isOpen: boolean;
  initialIsHistorical?: boolean;
}

export const useWorkOrderForm = ({ workOrder, equipmentId, isOpen, initialIsHistorical = false }: UseWorkOrderFormProps) => {
  const isEditMode = !!workOrder;

  const initialValues: Partial<WorkOrderFormData> = {
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    equipmentId: workOrder?.equipment_id || equipmentId || '',
    priority: workOrder?.priority || 'medium',
    dueDate: workOrder?.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : undefined,
    equipmentWorkingHours: undefined,
    hasPM: workOrder?.has_pm || false,
    assignmentType: 'unassigned',
    assignmentId: '',
    isHistorical: initialIsHistorical,
    // Historical fields (only relevant when isHistorical is true)
    status: 'accepted',
    historicalStartDate: undefined,
    historicalNotes: '',
    completedDate: undefined,
  };

  const form = useFormValidation(workOrderFormSchema, initialValues);

  // Reset form when workOrder changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.setValue('title', initialValues.title || '');
      form.setValue('description', initialValues.description || '');
      form.setValue('equipmentId', initialValues.equipmentId || '');
      form.setValue('priority', initialValues.priority || 'medium');
      form.setValue('dueDate', initialValues.dueDate || undefined);
      form.setValue('equipmentWorkingHours', initialValues.equipmentWorkingHours);
      form.setValue('hasPM', initialValues.hasPM || false);
      form.setValue('assignmentType', initialValues.assignmentType || 'unassigned');
      form.setValue('assignmentId', initialValues.assignmentId || '');
      form.setValue('isHistorical', initialValues.isHistorical || false);
      form.setValue('status', initialValues.status);
      form.setValue('historicalStartDate', initialValues.historicalStartDate);
      form.setValue('historicalNotes', initialValues.historicalNotes || '');
      form.setValue('completedDate', initialValues.completedDate);
    }
  }, [isOpen, workOrder]);

  const checkForUnsavedChanges = (): boolean => {
    return Object.keys(form.values).some(
      key => form.values[key as keyof WorkOrderFormData] !== initialValues[key as keyof WorkOrderFormData]
    );
  };

  return {
    form,
    isEditMode,
    initialValues,
    checkForUnsavedChanges,
  };
};