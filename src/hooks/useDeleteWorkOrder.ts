import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWorkOrderCascade } from '@/services/deleteWorkOrderService';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: deleteWorkOrderCascade,
    onSuccess: () => {
      // Invalidate all work order related queries
      queryClient.invalidateQueries({ 
        queryKey: ['workOrders'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['workOrder'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['dashboardStats'] 
      });
      
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['workOrders', currentOrganization.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['dashboardStats', currentOrganization.id] 
        });
      }

      toast({
        title: "Work Order Deleted",
        description: "The work order and all associated data have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Delete work order error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the work order. Please try again.",
        variant: "destructive",
      });
    }
  });
};