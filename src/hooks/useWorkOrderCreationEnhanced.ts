
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { createWorkOrder } from '@/services/supabaseDataService';
import { createPM } from '@/services/preventativeMaintenanceService';
import { toast } from 'sonner';

export interface EnhancedCreateWorkOrderData {
  title: string;
  description: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  hasPM?: boolean;
  assignmentType?: 'user' | 'team';
  assignmentId?: string;
}

export const useCreateWorkOrderEnhanced = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnhancedCreateWorkOrderData) => {
      if (!currentOrganization) {
        throw new Error('No organization selected');
      }

      // Create the work order
      const workOrderData = {
        title: data.title,
        description: data.description,
        equipment_id: data.equipmentId,
        priority: data.priority,
        due_date: data.dueDate,
        estimated_hours: data.estimatedHours,
        has_pm: data.hasPM || false,
        pm_required: data.hasPM || false,
        assignee_id: data.assignmentType === 'user' ? data.assignmentId : undefined,
        team_id: data.assignmentType === 'team' ? data.assignmentId : undefined,
        status: 'submitted' as const,
        acceptance_date: null
      };

      const workOrder = await createWorkOrder(currentOrganization.id, workOrderData);
      
      if (!workOrder) {
        throw new Error('Failed to create work order');
      }

      // If PM is required, create the PM record
      if (data.hasPM) {
        const pmData = {
          workOrderId: workOrder.id,
          equipmentId: data.equipmentId,
          organizationId: currentOrganization.id,
          checklistData: [], // Will be initialized with default checklist
        };

        const pm = await createPM(pmData);
        if (!pm) {
          console.error('Failed to create PM record');
          // Don't throw error here - work order was created successfully
          toast.error('Work order created but failed to create PM checklist');
        }
      }

      return workOrder;
    },
    onSuccess: () => {
      toast.success('Work order created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrdersByOrganization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
      toast.error('Failed to create work order');
    },
  });
};
