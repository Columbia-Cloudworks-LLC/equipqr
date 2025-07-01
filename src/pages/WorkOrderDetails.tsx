import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Clock, Calendar, User, Users, Wrench, FileText, Shield, AlertCircle, Clipboard, Menu } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncWorkOrderById, useSyncEquipmentById } from '@/services/syncDataService';
import { useWorkOrderPermissionLevels } from '@/hooks/useWorkOrderPermissionLevels';
import { usePMByWorkOrderId } from '@/hooks/usePMData';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedWorkOrderStatusManagerWithPM from '@/components/work-orders/EnhancedWorkOrderStatusManagerWithPM';
import WorkOrderDetailsInfo from '@/components/work-orders/WorkOrderDetailsInfo';
import WorkOrderTimeline from '@/components/work-orders/WorkOrderTimeline';
import WorkOrderNotesSection from '@/components/work-orders/WorkOrderNotesSection';
import WorkOrderImagesSection from '@/components/work-orders/WorkOrderImagesSection';
import WorkOrderFormEnhanced from '@/components/work-orders/WorkOrderFormEnhanced';
import PMChecklistComponent from '@/components/work-orders/PMChecklistComponent';

const WorkOrderDetails = () => {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Use sync hooks for data
  const { data: workOrder, isLoading: workOrderLoading } = useSyncWorkOrderById(
    currentOrganization?.id || '', 
    workOrderId || ''
  );
  const { data: equipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    workOrder?.equipment_id || ''
  );

  // Fetch PM data if work order has PM enabled
  const { data: pmData, isLoading: pmLoading } = usePMByWorkOrderId(workOrderId || '');

  const permissionLevels = useWorkOrderPermissionLevels();

  if (!workOrderId || !currentOrganization) {
    return <Navigate to="/work-orders" replace />;
  }

  if (workOrderLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!workOrder) {
    return <Navigate to="/work-orders" replace />;
  }

  // Fix: Use actual user ID instead of hardcoded value
  const createdByCurrentUser = workOrder.created_by === user?.id;
  const formMode = permissionLevels.getFormMode(workOrder, createdByCurrentUser);

  // Debug logging for troubleshooting
  console.log('🔍 WorkOrder Details Debug:', {
    workOrderId,
    currentUserId: user?.id,
    createdBy: workOrder.created_by,
    createdByCurrentUser,
    formMode,
    hasPM: workOrder.has_pm,
    pmData: pmData ? 'loaded' : 'null',
    permissionLevels
  });

  // Check if work order status allows modifications
  const isWorkOrderLocked = workOrder.status === 'completed' || workOrder.status === 'cancelled';
  
  // Calculate permission to add notes and images
  const baseCanAddNotes = permissionLevels.isManager || createdByCurrentUser;
  const baseCanUpload = permissionLevels.isManager || createdByCurrentUser;
  
  const canAddNotes = baseCanAddNotes && !isWorkOrderLocked;
  const canUpload = baseCanUpload && !isWorkOrderLocked;

  const handleEditWorkOrder = () => {
    setIsEditFormOpen(true);
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
  };

  const handleUpdateWorkOrder = () => {
    // Refresh the work order data after update
    queryClient.invalidateQueries({ 
      queryKey: ['workOrder', 'enhanced', currentOrganization.id, workOrderId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['workOrder', currentOrganization.id, workOrderId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['workOrders', currentOrganization.id] 
    });
    setIsEditFormOpen(false);
  };

  const handleStatusUpdate = () => {
    // Invalidate all relevant queries to refresh the data
    queryClient.invalidateQueries({ 
      queryKey: ['workOrder', 'enhanced', currentOrganization.id, workOrderId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['workOrder', currentOrganization.id, workOrderId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['workOrders', currentOrganization.id] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['dashboardStats', currentOrganization.id] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['preventativeMaintenance', workOrderId] 
    });
  };

  const handlePMUpdate = () => {
    // Refresh PM data and work order data
    queryClient.invalidateQueries({ 
      queryKey: ['preventativeMaintenance', workOrderId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['workOrder', currentOrganization.id, workOrderId] 
    });
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background border-b lg:hidden">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex-1 mx-4 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold truncate">{workOrder.title}</h1>
              {workOrder.has_pm && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs shrink-0">
                  <Clipboard className="h-3 w-3 mr-1" />
                  PM
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Badge className={`${getPriorityColor(workOrder.priority)} text-xs`}>
                {workOrder.priority}
              </Badge>
              <Badge className={`${getStatusColor(workOrder.status)} text-xs`}>
                {formatStatus(workOrder.status)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEditWorkOrder}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/work-orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Work Orders
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{workOrder.title}</h1>
                {workOrder.has_pm && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Clipboard className="h-3 w-3 mr-1" />
                    PM Required
                  </Badge>
                )}
              </div>
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
      </div>

      {/* Status Lock Warning */}
      {isWorkOrderLocked && baseCanAddNotes && (
        <div className="px-4 lg:px-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  This work order is {workOrder.status}. Notes and images cannot be added or modified.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className={`${isMobile ? 'block' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'} p-4 lg:p-6`}>
        {/* Main Content */}
        <div className={`${isMobile ? 'space-y-4' : 'lg:col-span-2 space-y-6'}`}>
          {/* Work Order Details */}
          <WorkOrderDetailsInfo workOrder={workOrder} equipment={equipment} />

          {/* PM Checklist Section - Now using single responsive component */}
          {workOrder.has_pm && pmData && (permissionLevels.isManager || permissionLevels.isTechnician) && (
            <PMChecklistComponent 
              pm={pmData} 
              onUpdate={handlePMUpdate}
              readOnly={isWorkOrderLocked || (!permissionLevels.isManager && !permissionLevels.isTechnician)}
            />
          )}

          {/* PM Loading State */}
          {workOrder.has_pm && pmLoading && (permissionLevels.isManager || permissionLevels.isTechnician) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5" />
                  Loading PM Checklist...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          )}

          {/* PM Info for Requestors */}
          {workOrder.has_pm && permissionLevels.isRequestor && !permissionLevels.isManager && pmData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5" />
                  Preventative Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">PM Status:</span>
                    <Badge className={
                      pmData.status === 'completed' ? 'bg-green-100 text-green-800' :
                      pmData.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {pmData.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This work order includes preventative maintenance tasks that will be completed by the assigned technician.
                  </p>
                  {pmData.status === 'completed' && pmData.completed_at && (
                    <p className="text-sm text-green-600">
                      PM completed on {new Date(pmData.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <WorkOrderNotesSection 
            workOrderId={workOrder.id}
            canAddNotes={canAddNotes}
            showPrivateNotes={permissionLevels.isManager}
          />

          {/* Images Section */}
          <WorkOrderImagesSection 
            workOrderId={workOrder.id}
            canUpload={canUpload}
          />

          {/* Timeline - Show appropriate level of detail based on permissions */}
          <WorkOrderTimeline 
            workOrder={workOrder} 
            showDetailedHistory={permissionLevels.isManager}
          />
        </div>

        {/* Sidebar - Mobile overlay or desktop sidebar */}
        <div className={`
          ${isMobile ? (
            showMobileSidebar 
              ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' 
              : 'hidden'
          ) : 'space-y-6'}
        `}>
          {isMobile && showMobileSidebar && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Work Order Info</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMobileSidebar(false)}
              >
                ✕
              </Button>
            </div>
          )}

          <div className="space-y-4 lg:space-y-6">
            {/* Enhanced Status Management with PM awareness - Only managers can change status */}
            {permissionLevels.isManager && (
              <EnhancedWorkOrderStatusManagerWithPM 
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

                {/* PM Status in Quick Info */}
                {workOrder.has_pm && pmData && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clipboard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">PM Status</div>
                      <div className="text-muted-foreground">
                        {pmData.status.replace('_', ' ').toUpperCase()}
                      </div>
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
      </div>

      {/* Edit Work Order Form - Pass workOrder for edit mode */}
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
