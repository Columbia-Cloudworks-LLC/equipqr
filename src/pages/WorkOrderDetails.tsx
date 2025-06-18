
import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Clock, Calendar, User, Users, Wrench, FileText } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSyncWorkOrderById, useSyncEquipmentById } from '@/services/syncDataService';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import WorkOrderStatusManager from '@/components/work-orders/WorkOrderStatusManager';
import WorkOrderDetailsInfo from '@/components/work-orders/WorkOrderDetailsInfo';
import WorkOrderTimeline from '@/components/work-orders/WorkOrderTimeline';
import WorkOrderFormEnhanced from '@/components/work-orders/WorkOrderFormEnhanced';

const WorkOrderDetails = () => {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const { currentOrganization } = useOrganization();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Use sync hooks for data
  const { data: workOrder, isLoading: workOrderLoading } = useSyncWorkOrderById(
    currentOrganization?.id || '', 
    workOrderId || ''
  );
  const { data: equipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    workOrder?.equipmentId || ''
  );

  const permissions = useUnifiedPermissions();

  if (!workOrderId || !currentOrganization) {
    return <Navigate to="/work-orders" replace />;
  }

  if (workOrderLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!workOrder) {
    return <Navigate to="/work-orders" replace />;
  }

  const workOrderPermissions = permissions.workOrders.getPermissions(workOrder);

  const handleEditWorkOrder = () => {
    setIsEditFormOpen(true);
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
  };

  const handleUpdateWorkOrder = (data: any) => {
    console.log('Updating work order:', data);
    // Here you would typically update the work order in your data service
    setIsEditFormOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{workOrder.title}</h1>
            <p className="text-muted-foreground">Work Order #{workOrder.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(workOrder.priority)}>
            {workOrder.priority} priority
          </Badge>
          <Badge className={getStatusColor(workOrder.status)}>
            {formatStatus(workOrder.status)}
          </Badge>
          {workOrderPermissions.canEdit && (
            <Button variant="outline" onClick={handleEditWorkOrder}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Details */}
          <WorkOrderDetailsInfo workOrder={workOrder} equipment={equipment} />

          {/* Timeline */}
          <WorkOrderTimeline workOrder={workOrder} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <WorkOrderStatusManager workOrder={workOrder} />

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-muted-foreground">
                    {new Date(workOrder.createdDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {workOrder.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Due Date</div>
                    <div className="text-muted-foreground">
                      {new Date(workOrder.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {workOrder.assigneeName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Assigned to</div>
                    <div className="text-muted-foreground">{workOrder.assigneeName}</div>
                  </div>
                </div>
              )}

              {workOrder.teamName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Team</div>
                    <div className="text-muted-foreground">{workOrder.teamName}</div>
                  </div>
                </div>
              )}

              {workOrder.estimatedHours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Estimated Hours</div>
                    <div className="text-muted-foreground">{workOrder.estimatedHours}h</div>
                  </div>
                </div>
              )}

              {equipment && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Equipment</div>
                      <Link 
                        to={`/equipment/${equipment.id}`}
                        className="text-primary hover:underline"
                      >
                        {equipment.name}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Work Order Form */}
      <WorkOrderFormEnhanced
        open={isEditFormOpen}
        onClose={handleCloseEditForm}
        workOrder={workOrder}
        onSubmit={handleUpdateWorkOrder}
      />
    </div>
  );
};

export default WorkOrderDetails;
