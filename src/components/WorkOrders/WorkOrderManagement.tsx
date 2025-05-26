
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrdersList } from './WorkOrdersList';
import { CreateWorkOrderParams } from '@/types/workOrders';
import { 
  getWorkOrders, 
  createWorkOrder,
  canSubmitWorkOrders,
  canManageWorkOrders,
  canViewWorkOrderHours
} from '@/services/workOrders';

interface WorkOrderManagementProps {
  equipmentId: string;
}

export function WorkOrderManagement({ equipmentId }: WorkOrderManagementProps) {
  const queryClient = useQueryClient();

  // Permission checks
  const { data: canSubmit = false } = useQuery({
    queryKey: ['canSubmitWorkOrders', equipmentId],
    queryFn: () => canSubmitWorkOrders(equipmentId)
  });

  const { data: canManage = false } = useQuery({
    queryKey: ['canManageWorkOrders', equipmentId],
    queryFn: () => canManageWorkOrders(equipmentId)
  });

  const { data: canViewHours = false } = useQuery({
    queryKey: ['canViewWorkOrderHours', equipmentId],
    queryFn: () => canViewWorkOrderHours(equipmentId)
  });

  // Work orders query
  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders', equipmentId],
    queryFn: () => getWorkOrders(equipmentId)
  });

  // Create work order mutation
  const createMutation = useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders', equipmentId] });
      toast.success('Work order submitted successfully');
    },
    onError: (error: any) => {
      console.error('Error creating work order:', error);
      toast.error('Failed to submit work order: ' + error.message);
    }
  });

  const handleSubmitWorkOrder = async (params: CreateWorkOrderParams) => {
    await createMutation.mutateAsync(params);
  };

  if (!canSubmit && !canManage) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        You don't have permission to view work orders for this equipment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Work Orders</TabsTrigger>
          {canSubmit && (
            <TabsTrigger value="submit">Submit New</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <WorkOrdersList
            workOrders={workOrders}
            isLoading={isLoading}
            canViewHours={canViewHours}
          />
        </TabsContent>

        {canSubmit && (
          <TabsContent value="submit">
            <WorkOrderForm
              equipmentId={equipmentId}
              onSubmit={handleSubmitWorkOrder}
              isSubmitting={createMutation.isPending}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
