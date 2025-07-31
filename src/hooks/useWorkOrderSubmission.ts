import { useOrganization } from '@/contexts/OrganizationContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useCreateWorkOrderEnhanced, EnhancedCreateWorkOrderData } from '@/hooks/useWorkOrderCreationEnhanced';
import { useUpdateWorkOrder, UpdateWorkOrderData } from '@/hooks/useWorkOrderUpdate';
import { useCreateHistoricalWorkOrder, HistoricalWorkOrderData } from '@/hooks/useHistoricalWorkOrders';
import { EnhancedWorkOrder } from '@/services/workOrderDataService';
import { WorkOrderFormData } from './useWorkOrderForm';
import { dateToISOString } from '@/lib/utils';

interface UseWorkOrderSubmissionProps {
  workOrder?: EnhancedWorkOrder;
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
  const createHistoricalWorkOrderMutation = useCreateHistoricalWorkOrder();

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
          hasPM: data.hasPM,
        };
        
        await updateWorkOrderMutation.mutateAsync({
          workOrderId: workOrder.id,
          data: updateData
        });
      } else if (data.isHistorical) {
        // Create historical work order
        const historicalData: HistoricalWorkOrderData = {
          equipmentId: data.equipmentId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status || 'accepted',
          historicalStartDate: dateToISOString(data.historicalStartDate) || '',
          historicalNotes: data.historicalNotes,
          assigneeId: data.assignmentId,
          teamId: undefined, // Will be auto-determined by equipment
          dueDate: data.dueDate,
          completedDate: dateToISOString(data.completedDate),
          hasPM: data.hasPM,
          pmStatus: 'pending',
          pmCompletionDate: undefined,
          pmNotes: '',
          pmChecklistData: []
        };
        
        await createHistoricalWorkOrderMutation.mutateAsync(historicalData);
      } else {
        // Create new regular work order
        const workOrderData: EnhancedCreateWorkOrderData = {
          title: data.title,
          description: data.description,
          equipmentId: data.equipmentId,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          hasPM: data.hasPM,
          assignmentType: data.assignmentType === 'unassigned' ? undefined : data.assignmentType,
          assignmentId: data.assignmentType === 'unassigned' ? undefined : data.assignmentId,
          equipmentWorkingHours: data.equipmentWorkingHours,
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

  const isLoading = isSubmitting || createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending || createHistoricalWorkOrderMutation.isPending;

  return {
    submitForm,
    isLoading,
    isEditMode,
  };
};