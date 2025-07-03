import { useEffect } from 'react';
import { z } from 'zod';
import { useFormValidation } from '@/hooks/useFormValidation';
import { WorkOrder } from '@/services/supabaseDataService';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  hasPM: z.boolean().default(false),
  assignmentType: z.enum(['unassigned', 'user', 'team']).optional(),
  assignmentId: z.string().optional(),
});

export type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface UseWorkOrderFormProps {
  workOrder?: WorkOrder;
  equipmentId?: string;
  isOpen: boolean;
}

export const useWorkOrderForm = ({ workOrder, equipmentId, isOpen }: UseWorkOrderFormProps) => {
  const isEditMode = !!workOrder;

  const initialValues: Partial<WorkOrderFormData> = {
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    equipmentId: workOrder?.equipment_id || equipmentId || '',
    priority: workOrder?.priority || 'medium',
    dueDate: workOrder?.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : '',
    estimatedHours: workOrder?.estimated_hours || undefined,
    hasPM: workOrder?.has_pm || false,
    assignmentType: 'unassigned',
    assignmentId: '',
  };

  const form = useFormValidation(workOrderFormSchema, initialValues);

  // Reset form when workOrder changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.setValue('title', initialValues.title || '');
      form.setValue('description', initialValues.description || '');
      form.setValue('equipmentId', initialValues.equipmentId || '');
      form.setValue('priority', initialValues.priority || 'medium');
      form.setValue('dueDate', initialValues.dueDate || '');
      form.setValue('estimatedHours', initialValues.estimatedHours);
      form.setValue('hasPM', initialValues.hasPM || false);
      form.setValue('assignmentType', initialValues.assignmentType || 'unassigned');
      form.setValue('assignmentId', initialValues.assignmentId || '');
    }
  }, [isOpen, workOrder, form]);

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