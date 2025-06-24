
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getPMByWorkOrderId, updatePM, PreventativeMaintenance, UpdatePMData } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

export const usePMByWorkOrderId = (workOrderId: string) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['preventativeMaintenance', workOrderId],
    queryFn: () => getPMByWorkOrderId(workOrderId),
    enabled: !!workOrderId && !!currentOrganization,
  });
};

export const useUpdatePM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pmId, data }: { pmId: string; data: UpdatePMData }) => {
      return await updatePM(pmId, data);
    },
    onSuccess: (updatedPM, variables) => {
      if (updatedPM) {
        queryClient.invalidateQueries({ 
          queryKey: ['preventativeMaintenance', updatedPM.work_order_id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['workOrder'] 
        });
        toast.success('PM updated successfully');
      }
    },
    onError: (error) => {
      console.error('Error updating PM:', error);
      toast.error('Failed to update PM');
    },
  });
};
