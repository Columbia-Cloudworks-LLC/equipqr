
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPM, defaultForkliftChecklist } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

export const useInitializePMChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workOrderId,
      equipmentId,
      organizationId
    }: {
      workOrderId: string;
      equipmentId: string;
      organizationId: string;
    }) => {
      console.log('🔧 Initializing PM checklist for work order:', workOrderId);
      
      const pmRecord = await createPM({
        workOrderId,
        equipmentId,
        organizationId,
        checklistData: defaultForkliftChecklist,
        notes: 'PM checklist initialized with default forklift maintenance items.'
      });

      if (!pmRecord) {
        throw new Error('Failed to create PM record');
      }

      console.log('✅ PM checklist initialized successfully:', pmRecord.id);
      return pmRecord;
    },
    onSuccess: (pmRecord, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['preventativeMaintenance', variables.workOrderId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['workOrder', variables.organizationId, variables.workOrderId] 
      });
      
      toast.success('PM checklist initialized successfully');
    },
    onError: (error) => {
      console.error('❌ Error initializing PM checklist:', error);
      toast.error('Failed to initialize PM checklist');
    }
  });
};
