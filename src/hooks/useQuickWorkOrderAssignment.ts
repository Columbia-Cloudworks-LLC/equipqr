import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuickWorkOrderAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, assigneeId }: { workOrderId: string; assigneeId: string }) => {
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
    onSuccess: () => {
      toast.success('Work order assigned successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrdersByOrganization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error) => {
      console.error('Error assigning work order:', error);
      toast.error('Failed to assign work order');
    },
  });
};