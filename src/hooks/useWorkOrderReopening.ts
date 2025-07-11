import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReopenWorkOrderParams {
  workOrderId: string;
  organizationId: string;
}

export const useWorkOrderReopening = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ workOrderId, organizationId }: ReopenWorkOrderParams) => {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          status: 'submitted',
          completed_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate work orders queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders'] });
      
      toast({
        title: "Work Order Reopened",
        description: "The work order has been successfully reopened",
      });
    },
    onError: (error) => {
      console.error('Error reopening work order:', error);
      toast({
        title: "Error",
        description: "Failed to reopen work order",
        variant: "destructive",
      });
    },
  });
};