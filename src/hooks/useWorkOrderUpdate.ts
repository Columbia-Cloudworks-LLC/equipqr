
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';
import { WorkOrderUpdateData, UpdateWorkOrderData } from '@/types/updateData';

export const useUpdateWorkOrder = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, data }: { workOrderId: string; data: UpdateWorkOrderData }) => {
      const updateData: WorkOrderUpdateData = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate || null;
      if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours || null;
      if (data.hasPM !== undefined) updateData.has_pm = data.hasPM;

      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating work order:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch work order queries with standardized keys
      queryClient.invalidateQueries({ 
        queryKey: ['enhanced-work-orders', currentOrganization?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['workOrders', currentOrganization?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['work-orders-filtered-optimized', currentOrganization?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['dashboardStats', currentOrganization?.id] 
      });
      
      toast({
        title: 'Work Order Updated',
        description: 'Work order has been successfully updated.',
      });
    },
    onError: (error) => {
      console.error('Update work order error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update work order. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
