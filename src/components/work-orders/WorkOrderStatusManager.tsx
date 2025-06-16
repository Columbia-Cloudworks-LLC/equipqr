
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Play, Pause, CheckCircle, XCircle, Settings } from 'lucide-react';
import { WorkOrder, updateWorkOrderStatus } from '@/services/dataService';

interface WorkOrderStatusManagerProps {
  workOrder: WorkOrder;
}

const WorkOrderStatusManager: React.FC<WorkOrderStatusManagerProps> = ({ workOrder }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  // Mock current user role - in real app this would come from auth context
  const currentUserRole = 'manager' as 'owner' | 'manager' | 'technician' | 'requestor' | 'viewer';

  const canManageStatus = ['owner', 'manager', 'technician'].includes(currentUserRole);

  const getNextStatusOptions = (currentStatus: WorkOrder['status']) => {
    switch (currentStatus) {
      case 'submitted':
        return [
          { value: 'accepted', label: 'Accept', icon: CheckCircle },
          { value: 'cancelled', label: 'Cancel', icon: XCircle }
        ];
      case 'accepted':
        return [
          { value: 'assigned', label: 'Assign', icon: Settings },
          { value: 'cancelled', label: 'Cancel', icon: XCircle }
        ];
      case 'assigned':
        return [
          { value: 'in_progress', label: 'Start Work', icon: Play },
          { value: 'on_hold', label: 'Put on Hold', icon: Pause },
          { value: 'cancelled', label: 'Cancel', icon: XCircle }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Complete', icon: CheckCircle },
          { value: 'on_hold', label: 'Put on Hold', icon: Pause },
          { value: 'cancelled', label: 'Cancel', icon: XCircle }
        ];
      case 'on_hold':
        return [
          { value: 'in_progress', label: 'Resume Work', icon: Play },
          { value: 'cancelled', label: 'Cancel', icon: XCircle }
        ];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus: WorkOrder['status']) => {
    if (!currentOrganization) return;

    setIsUpdating(true);
    try {
      const success = updateWorkOrderStatus(currentOrganization.id, workOrder.id, newStatus);
      
      if (success) {
        toast({
          title: "Status Updated",
          description: `Work order status changed to ${newStatus.replace('_', ' ')}`,
        });
        
        // In a real app, you would refresh the data or use a state management solution
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update work order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const nextStatusOptions = getNextStatusOptions(workOrder.status);

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

        {canManageStatus && nextStatusOptions.length > 0 && (
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
                    className="w-full justify-start"
                    onClick={() => handleStatusUpdate(option.value as WorkOrder['status'])}
                    disabled={isUpdating}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {!canManageStatus && (
          <p className="text-sm text-muted-foreground">
            You don't have permission to change the status of this work order.
          </p>
        )}

        {nextStatusOptions.length === 0 && canManageStatus && (
          <p className="text-sm text-muted-foreground">
            No status changes available for {formatStatus(workOrder.status)} work orders.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkOrderStatusManager;
