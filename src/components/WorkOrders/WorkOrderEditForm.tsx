
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkOrder, UpdateWorkOrderParams, WorkOrderStatus } from '@/types/workOrders';

interface WorkOrderEditFormProps {
  workOrder: WorkOrder;
  onUpdate: (id: string, updates: UpdateWorkOrderParams) => Promise<void>;
  onCancel: () => void;
}

export function WorkOrderEditForm({ workOrder, onUpdate, onCancel }: WorkOrderEditFormProps) {
  const [estimatedHours, setEstimatedHours] = useState(workOrder.estimated_hours?.toString() || '');
  const [status, setStatus] = useState<WorkOrderStatus>(workOrder.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: UpdateWorkOrderParams = {
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        status: status
      };
      
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
