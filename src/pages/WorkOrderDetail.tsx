
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/Layout/Layout';
import { WorkOrderDetail as WorkOrderDetailComponent } from '@/components/WorkOrders/WorkOrderDetail';
import { WorkOrderWorkNotes } from '@/components/WorkOrders/WorkOrderWorkNotes';
import { getWorkOrder, updateWorkOrder } from '@/services/workOrders';
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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading work order...</div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !workOrder) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                {error ? 'Error loading work order' : 'Work order not found'}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{workOrder.title}</h1>
              <p className="text-muted-foreground">
                Work Order #{workOrder.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Equipment: {workOrder.equipment_name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <WorkOrderDetailComponent
              workOrder={workOrder}
              canManage={true} // TODO: Implement proper permission check
              onUpdate={handleUpdate}
              onClose={() => {}} // Not used in this context
            />
          </div>

          {/* Work Notes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Work Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkOrderWorkNotes 
                  workOrderId={workOrder.id}
                  equipmentId={workOrder.equipment_id}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
