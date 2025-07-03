import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuickWorkOrderAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, assigneeId, organizationId }: { workOrderId: string; assigneeId: string; organizationId: string }) => {
      const { error } = await supabase
        .from('work_orders')
        .update({
          assignee_id: assigneeId,
          status: 'assigned',
          acceptance_date: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (error) throw error;
    },
    onSuccess: (_, { organizationId }) => {
      toast.success('Work order assigned successfully');
      
      // Invalidate relevant queries with standardized keys
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-filtered-optimized', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', organizationId] });
    },
    onError: (error) => {
      console.error('Error assigning work order:', error);
      toast.error('Failed to assign work order');
    },
  });
};