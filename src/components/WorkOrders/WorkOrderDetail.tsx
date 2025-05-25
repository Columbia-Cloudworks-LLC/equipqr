
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Clock, Edit2 } from 'lucide-react';
import { WorkOrder, UpdateWorkOrderParams, WorkOrderStatus } from '@/types/workOrders';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { format } from 'date-fns';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  canManage: boolean;
  onUpdate: (id: string, updates: UpdateWorkOrderParams) => Promise<void>;
  onClose: () => void;
}

export function WorkOrderDetail({ workOrder, canManage, onUpdate, onClose }: WorkOrderDetailProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [estimatedHours, setEstimatedHours] = React.useState(workOrder.estimated_hours?.toString() || '');
  const [status, setStatus] = React.useState<WorkOrderStatus>(workOrder.status);

  const handleSave = async () => {
    const updates: UpdateWorkOrderParams = {
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      status: status
    };
    
    await onUpdate(workOrder.id, updates);
    setIsEditing(false);
  };

  const getAvailableStatuses = (): WorkOrderStatus[] => {
    switch (workOrder.status) {
      case 'submitted':
        return ['submitted', 'accepted'];
      case 'accepted':
        return ['accepted', 'assigned'];
      case 'assigned':
        return ['assigned', 'in_progress'];
      case 'in_progress':
        return ['in_progress', 'on_hold', 'completed', 'cancelled'];
      case 'on_hold':
        return ['on_hold', 'in_progress', 'cancelled'];
      default:
        return [workOrder.status];
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as WorkOrderStatus);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{workOrder.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(workOrder.submitted_at), 'MMM d, yyyy')}
              </div>
              {workOrder.submitted_by_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {workOrder.submitted_by_name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WorkOrderStatusBadge status={workOrder.status} />
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground mt-1">{workOrder.description}</p>
        </div>

        {canManage && isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimated-hours">Estimated Hours</Label>
              <Input
                id="estimated-hours"
                type="number"
                step="0.25"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="Enter estimated hours"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableStatuses().map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {statusOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {workOrder.estimated_hours && (
              <div>
                <Label className="text-sm font-medium">Estimated Hours</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{workOrder.estimated_hours}h</span>
                </div>
              </div>
            )}
            {workOrder.assigned_to_name && (
              <div>
                <Label className="text-sm font-medium">Assigned To</Label>
                <div className="flex items-center gap-1 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{workOrder.assigned_to_name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
