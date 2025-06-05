
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout/Layout';
import { WorkOrderDetailView } from '@/components/WorkOrders/WorkOrderDetailView';
import { getWorkOrder, updateWorkOrder } from '@/services/workOrders';
import { canManageWorkOrders } from '@/services/workOrders/workOrderPermissions';
import { UpdateWorkOrderParams } from '@/types/workOrders';
import { toast } from 'sonner';

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workOrder, isLoading, error } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => getWorkOrder(id!),
    enabled: !!id
  });

  // Check if user can manage work orders for this equipment
  const { data: canManage = false } = useQuery({
    queryKey: ['canManageWorkOrders', workOrder?.equipment_id],
    queryFn: () => workOrder ? canManageWorkOrders(workOrder.equipment_id) : Promise.resolve(false),
    enabled: !!workOrder?.equipment_id
  });

  const updateMutation = useMutation({
    mutationFn: ({ workOrderId, updates }: { workOrderId: string; updates: UpdateWorkOrderParams }) =>
      updateWorkOrder(workOrderId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Work order updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update work order: ' + error.message);
    }
  });

  const handleUpdate = async (workOrderId: string, updates: UpdateWorkOrderParams) => {
    await updateMutation.mutateAsync({ workOrderId, updates });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading work order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !workOrder) {
    return (
      <Layout>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="text-destructive mb-4">
              {error ? 'Error loading work order' : 'Work order not found'}
            </div>
            <Button onClick={() => navigate('/work-orders')}>
              Return to Work Orders
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <WorkOrderDetailView
        workOrder={workOrder}
        onUpdate={handleUpdate}
        onBack={() => navigate('/work-orders')}
        canManage={canManage}
      />
    </Layout>
  );
}
