
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, CheckCircle, XCircle, Settings, AlertTriangle, Clock } from 'lucide-react';
import { useUpdateWorkOrderStatus } from '@/hooks/useWorkOrderData';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EnhancedWorkOrderStatusManagerProps {
  workOrder: any;
  organizationId: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const EnhancedWorkOrderStatusManager: React.FC<EnhancedWorkOrderStatusManagerProps> = ({ 
  workOrder, 
  organizationId,
  onStatusUpdate 
}) => {
  const permissions = useUnifiedPermissions();
  const updateStatusMutation = useUpdateWorkOrderStatus();

  const workOrderPermissions = permissions.workOrders.getPermissions(workOrder);

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'submitted':
        return [
          { value: 'accepted', label: 'Accept Work Order', icon: CheckCircle, description: 'Accept and begin processing' },
          { value: 'cancelled', label: 'Cancel', icon: XCircle, description: 'Cancel this work order' }
        ];
      case 'accepted':
        return [
          { value: 'assigned', label: 'Assign to Team/Technician', icon: Settings, description: 'Assign to a team or individual' },
          { value: 'cancelled', label: 'Cancel', icon: XCircle, description: 'Cancel this work order' }
        ];
      case 'assigned':
        return [
          { value: 'in_progress', label: 'Start Work', icon: Play, description: 'Begin working on this order' },
          { value: 'on_hold', label: 'Put on Hold', icon: Pause, description: 'Temporarily pause work' },
          { value: 'cancelled', label: 'Cancel', icon: XCircle, description: 'Cancel this work order' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Mark Complete', icon: CheckCircle, description: 'Complete the work order' },
          { value: 'on_hold', label: 'Put on Hold', icon: Pause, description: 'Temporarily pause work' },
          { value: 'cancelled', label: 'Cancel', icon: XCircle, description: 'Cancel this work order' }
        ];
      case 'on_hold':
        return [
          { value: 'in_progress', label: 'Resume Work', icon: Play, description: 'Resume working on this order' },
          { value: 'cancelled', label: 'Cancel', icon: XCircle, description: 'Cancel this work order' }
        ];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        workOrderId: workOrder.id,
        status: newStatus,
        organizationId
      });
      
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const nextStatusOptions = getNextStatusOptions(workOrder.status);

  const getStatusColor = (status: string) => {
    const statusColors = {
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'accepted': 'bg-purple-100 text-purple-800 border-purple-200',
      'assigned': 'bg-orange-100 text-orange-800 border-orange-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'on_hold': 'bg-gray-100 text-gray-800 border-gray-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!permissions.context) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load permissions. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Current Status</label>
          <div className="mt-1">
            <Badge className={getStatusColor(workOrder.status)}>
              {formatStatus(workOrder.status)}
            </Badge>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Timeline</label>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Created: {format(new Date(workOrder.created_date), 'MMM d, yyyy h:mm a')}</span>
            </div>
            
            {workOrder.acceptance_date && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Accepted: {format(new Date(workOrder.acceptance_date), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            
            {workOrder.completed_date && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Completed: {format(new Date(workOrder.completed_date), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>
        </div>

        {workOrderPermissions.canChangeStatus && nextStatusOptions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Available Actions
            </label>
            <div className="space-y-2">
              {nextStatusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => handleStatusUpdate(option.value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {!workOrderPermissions.canChangeStatus && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to change the status of this work order. 
              Only organization admins and team members can update work order status.
            </AlertDescription>
          </Alert>
        )}

        {nextStatusOptions.length === 0 && workOrderPermissions.canChangeStatus && (
          <p className="text-sm text-muted-foreground">
            No status changes available for {formatStatus(workOrder.status)} work orders.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedWorkOrderStatusManager;
