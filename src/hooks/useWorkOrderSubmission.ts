import { useOrganization } from '@/contexts/OrganizationContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useCreateWorkOrderEnhanced, EnhancedCreateWorkOrderData } from '@/hooks/useWorkOrderCreationEnhanced';
import { useUpdateWorkOrder, UpdateWorkOrderData } from '@/hooks/useWorkOrderUpdate';
import { WorkOrder } from '@/services/supabaseDataService';
import { WorkOrderFormData } from './useWorkOrderForm';

interface UseWorkOrderSubmissionProps {
  workOrder?: WorkOrder;
  onSubmit?: (data: WorkOrderFormData) => void;
  onSuccess: () => void;
}

export const useWorkOrderSubmission = ({ workOrder, onSubmit, onSuccess }: UseWorkOrderSubmissionProps) => {
  const { currentOrganization } = useOrganization();
  const isEditMode = !!workOrder;

  const createWorkOrderMutation = useCreateWorkOrderEnhanced(
    (isEditMode || onSubmit) ? { onSuccess: onSuccess } : undefined
  );
  
  const updateWorkOrderMutation = useUpdateWorkOrder();

  const { execute: submitForm, isLoading: isSubmitting } = useAsyncOperation(
    async (data: WorkOrderFormData) => {
      if (onSubmit) {
        await onSubmit(data);
      } else if (isEditMode && workOrder) {
        // Update existing work order
        const updateData: UpdateWorkOrderData = {
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          estimatedHours: data.estimatedHours,
          hasPM: data.hasPM,
        };
        
        await updateWorkOrderMutation.mutateAsync({
          workOrderId: workOrder.id,
          data: updateData
        });
      } else {
        // Create new work order
        const workOrderData: EnhancedCreateWorkOrderData = {
          title: data.title,
          description: data.description,
          equipmentId: data.equipmentId,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          estimatedHours: data.estimatedHours,
          hasPM: data.hasPM,
          assignmentType: data.assignmentType === 'unassigned' ? undefined : data.assignmentType,
          assignmentId: data.assignmentType === 'unassigned' ? undefined : data.assignmentId,
        };
        
        await createWorkOrderMutation.mutateAsync(workOrderData);
      }
    },
    {
      onSuccess: () => {
        // Only call onSuccess for edit mode or custom onSubmit
        // For create mode without custom onSubmit, the hook handles navigation automatically
        if (isEditMode || onSubmit) {
          onSuccess();
        }
      }
    }
  );

  const isLoading = isSubmitting || createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending;

  return {
    submitForm,
    isLoading,
    isEditMode,
  };
};