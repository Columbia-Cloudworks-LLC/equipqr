
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { createWorkOrder } from '@/services/supabaseDataService';
import { createPM } from '@/services/preventativeMaintenanceService';
import { supabase } from '@/integrations/supabase/client';
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

export const useCreateWorkOrderEnhanced = (options?: { onSuccess?: (workOrder: any) => void }) => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: EnhancedCreateWorkOrderData) => {
      if (!currentOrganization) {
        throw new Error('No organization selected');
      }

      // Auto-assign logic for single-user organizations
      let assigneeId = data.assignmentType === 'user' ? data.assignmentId : undefined;
      let teamId = data.assignmentType === 'team' ? data.assignmentId : undefined;
      let status: 'submitted' | 'assigned' = 'submitted';

      // If no explicit assignment and it's a single-user org, auto-assign to creator
      if (!assigneeId && !teamId && currentOrganization.memberCount === 1) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          assigneeId = user.id;
          status = 'assigned';
        }
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
        assignee_id: assigneeId,
        team_id: teamId,
        status,
        acceptance_date: status === 'assigned' ? new Date().toISOString() : null
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
    onSuccess: (workOrder) => {
      toast.success('Work order created successfully');
      
      // Invalidate relevant queries with standardized keys
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', currentOrganization.id] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', currentOrganization.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-filtered-optimized', currentOrganization.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', currentOrganization.id] });
      
      // Call custom onSuccess if provided, otherwise navigate to work order details
      if (options?.onSuccess) {
        options.onSuccess(workOrder);
      } else {
        navigate(`/work-orders/${workOrder.id}`);
      }
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
      toast.error('Failed to create work order');
    },
  });
};
