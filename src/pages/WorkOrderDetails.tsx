
import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Clock, Calendar, User, Users, Wrench, FileText, Shield } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSyncWorkOrderById, useSyncEquipmentById } from '@/services/syncDataService';
import { useWorkOrderPermissionLevels } from '@/hooks/useWorkOrderPermissionLevels';
import EnhancedWorkOrderStatusManager from '@/components/work-orders/EnhancedWorkOrderStatusManager';
import WorkOrderDetailsInfo from '@/components/work-orders/WorkOrderDetailsInfo';
import WorkOrderTimeline from '@/components/work-orders/WorkOrderTimeline';
import WorkOrderNotesSection from '@/components/work-orders/WorkOrderNotesSection';
import WorkOrderImagesSection from '@/components/work-orders/WorkOrderImagesSection';
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
    workOrder?.equipment_id || ''
  );

  const permissionLevels = useWorkOrderPermissionLevels();

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

  const createdByCurrentUser = workOrder.created_by === 'current-user-id'; // Would be actual user ID
  const formMode = permissionLevels.getFormMode(workOrder, createdByCurrentUser);

  const handleEditWorkOrder = () => {
    setIsEditFormOpen(true);
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
  };

  const handleUpdateWorkOrder = (data: any) => {
    console.log('Updating work order:', data);
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

  const canEdit = formMode === 'manager' || (formMode === 'requestor' && createdByCurrentUser);

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
            <div className="flex items-center gap-2 text-muted-foreground">
              <p>Work Order #{workOrder.id}</p>
              {formMode === 'requestor' && !permissionLevels.isManager && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Limited Access
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(workOrder.priority)}>
            {workOrder.priority} priority
          </Badge>
          <Badge className={getStatusColor(workOrder.status)}>
            {formatStatus(workOrder.status)}
          </Badge>
          {canEdit && (
            <Button variant="outline" onClick={handleEditWorkOrder}>
              <Edit className="h-4 w-4 mr-2" />
              {formMode === 'requestor' ? 'Edit Request' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Details */}
          <WorkOrderDetailsInfo workOrder={workOrder} equipment={equipment} />

          {/* Notes Section - Requestors can add notes to their own work orders or view public notes */}
          <WorkOrderNotesSection 
            workOrderId={workOrder.id}
            canAddNotes={permissionLevels.isManager || createdByCurrentUser}
            showPrivateNotes={permissionLevels.isManager}
          />

          {/* Images Section - Requestors can upload images to their own work orders */}
          <WorkOrderImagesSection 
            workOrderId={workOrder.id}
            canUpload={permissionLevels.isManager || createdByCurrentUser}
          />

          {/* Timeline - Show appropriate level of detail based on permissions */}
          <WorkOrderTimeline 
            workOrder={workOrder} 
            showDetailedHistory={permissionLevels.isManager}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enhanced Status Management - Only managers can change status */}
          {permissionLevels.isManager && (
            <EnhancedWorkOrderStatusManager 
              workOrder={workOrder} 
              organizationId={currentOrganization.id}
            />
          )}

          {/* Status Info for Requestors */}
          {permissionLevels.isRequestor && !permissionLevels.isManager && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Request Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge className={getStatusColor(workOrder.status)}>
                      {formatStatus(workOrder.status)}
                    </Badge>
                  </div>
                  {workOrder.status === 'submitted' && (
                    <p className="text-sm text-muted-foreground">
                      Your request is awaiting review by a manager.
                    </p>
                  )}
                  {workOrder.status === 'accepted' && (
                    <p className="text-sm text-muted-foreground">
                      Your request has been approved and is being scheduled.
                    </p>
                  )}
                  {workOrder.status === 'assigned' && (
                    <p className="text-sm text-muted-foreground">
                      Work has been assigned to a team member.
                    </p>
                  )}
                  {workOrder.status === 'in_progress' && (
                    <p className="text-sm text-muted-foreground">
                      Work is currently in progress.
                    </p>
                  )}
                  {workOrder.status === 'completed' && (
                    <p className="text-sm text-green-600">
                      Work has been completed successfully.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    {new Date(workOrder.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {workOrder.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formMode === 'requestor' && workOrder.status === 'submitted' ? 'Preferred Due Date' : 'Due Date'}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(workOrder.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Only show assignment info to managers or if assigned to user */}
              {(permissionLevels.isManager || workOrder.assigneeName) && workOrder.assigneeName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Assigned to</div>
                    <div className="text-muted-foreground">{workOrder.assigneeName}</div>
                  </div>
                </div>
              )}

              {(permissionLevels.isManager || workOrder.teamName) && workOrder.teamName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Team</div>
                    <div className="text-muted-foreground">{workOrder.teamName}</div>
                  </div>
                </div>
              )}

              {permissionLevels.isManager && workOrder.estimated_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Estimated Hours</div>
                    <div className="text-muted-foreground">{workOrder.estimated_hours}h</div>
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
        workOrder={{
          ...workOrder,
          equipment_id: workOrder.equipment_id,
          created_date: workOrder.created_date,
          due_date: workOrder.due_date,
          estimated_hours: workOrder.estimated_hours,
          completed_date: workOrder.completed_date,
          assignee_id: workOrder.assignee_id,
          team_id: workOrder.team_id
        }}
        onSubmit={handleUpdateWorkOrder}
      />
    </div>
  );
};

export default WorkOrderDetails;
