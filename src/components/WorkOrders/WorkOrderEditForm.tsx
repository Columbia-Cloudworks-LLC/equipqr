
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkOrder, UpdateWorkOrderParams, WorkOrderStatus } from '@/types/workOrders';
import { getAssignableTeamMembers, sendAssignmentNotification, AssignableTeamMember } from '@/services/workOrders/workOrderAssignmentService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WorkOrderEditFormProps {
  workOrder: WorkOrder;
  onUpdate: (id: string, updates: UpdateWorkOrderParams) => Promise<void>;
  onCancel: () => void;
  canManage: boolean;
}

export function WorkOrderEditForm({ workOrder, onUpdate, onCancel, canManage }: WorkOrderEditFormProps) {
  const [estimatedHours, setEstimatedHours] = useState(workOrder.estimated_hours?.toString() || '');
  const [status, setStatus] = useState<WorkOrderStatus>(workOrder.status);
  const [assignedTo, setAssignedTo] = useState(workOrder.assigned_to || 'unassigned');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get assignable team members
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['assignableTeamMembers', workOrder.equipment_id],
    queryFn: () => getAssignableTeamMembers(workOrder.equipment_id),
    enabled: status === 'accepted' || status === 'assigned' || status === 'in_progress'
  });

  const getAvailableStatuses = (): WorkOrderStatus[] => {
    if (!canManage) {
      // Non-managers can only update status to limited states
      switch (workOrder.status) {
        case 'assigned':
          return ['assigned', 'in_progress'];
        case 'in_progress':
          return ['in_progress', 'on_hold', 'completed'];
        case 'on_hold':
          return ['on_hold', 'in_progress'];
        default:
          return [workOrder.status];
      }
    }

    // Managers can transition between all states
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
      case 'completed':
        return canManage ? ['completed', 'in_progress'] : ['completed'];
      case 'cancelled':
        return canManage ? ['cancelled', 'submitted'] : ['cancelled'];
      default:
        return [workOrder.status];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: UpdateWorkOrderParams = {
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        status: status
      };

      // Handle assignment
      if (assignedTo && assignedTo !== 'unassigned' && assignedTo !== workOrder.assigned_to) {
        updates.assigned_to = assignedTo;
        
        // Send notification to the assigned user
        try {
          await sendAssignmentNotification(
            assignedTo,
            workOrder.id,
            workOrder.title,
            workOrder.equipment_name || 'Unknown Equipment'
          );
          toast.success('Assignment notification sent');
        } catch (notificationError) {
          console.warn('Failed to send assignment notification:', notificationError);
          // Don't fail the whole operation if notification fails
        }
      } else if (assignedTo === 'unassigned') {
        updates.assigned_to = undefined;
      }
      
      await onUpdate(workOrder.id, updates);
      onCancel();
    } catch (error) {
      console.error('Failed to update work order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const showAssignmentField = status === 'accepted' || status === 'assigned' || status === 'in_progress';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Work Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
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
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as WorkOrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableStatuses().map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {formatStatusLabel(statusOption)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showAssignmentField && canManage && (
            <div className="space-y-2">
              <Label htmlFor="assigned-to">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {loadingMembers ? (
                    <SelectItem value="loading" disabled>Loading team members...</SelectItem>
                  ) : (
                    teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.display_name || member.email} ({member.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
