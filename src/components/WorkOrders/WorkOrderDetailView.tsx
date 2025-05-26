
import React, { useState } from 'react';
import { ArrowLeft, Edit, FileText, Clock, User, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WorkOrder, UpdateWorkOrderParams } from '@/types/workOrders';
import { WorkOrderEditForm } from './WorkOrderEditForm';
import { WorkOrderWorkNotes } from './WorkOrderWorkNotes';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { format } from 'date-fns';

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  onUpdate: (workOrderId: string, updates: UpdateWorkOrderParams) => Promise<void>;
  onBack: () => void;
  canManage: boolean;
}

export function WorkOrderDetailView({ workOrder, onUpdate, onBack, canManage }: WorkOrderDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (workOrderId: string, updates: UpdateWorkOrderParams) => {
    await onUpdate(workOrderId, updates);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
        <WorkOrderEditForm
          workOrder={workOrder}
          onUpdate={handleUpdate}
          onCancel={() => setIsEditing(false)}
          canManage={canManage}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
        
        {canManage && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Work Order
          </Button>
        )}
      </div>

      {/* Work Order Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{workOrder.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Equipment: {workOrder.equipment_name || 'Unknown'}
              </p>
            </div>
            <WorkOrderStatusBadge status={workOrder.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {workOrder.description && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {workOrder.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Submitted by:</span>
                <span className="text-sm text-muted-foreground">
                  {workOrder.submitted_by_name || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Submitted:</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(workOrder.submitted_at), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>

              {workOrder.assigned_to_name && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Assigned to:</span>
                  <span className="text-sm text-muted-foreground">
                    {workOrder.assigned_to_name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {workOrder.estimated_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Estimated hours:</span>
                  <span className="text-sm text-muted-foreground">
                    {workOrder.estimated_hours}h
                  </span>
                </div>
              )}

              {workOrder.accepted_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Accepted:</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(workOrder.accepted_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}

              {workOrder.completed_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Completed:</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(workOrder.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Notes Section */}
      <WorkOrderWorkNotes
        workOrderId={workOrder.id}
        equipmentId={workOrder.equipment_id}
      />
    </div>
  );
}
