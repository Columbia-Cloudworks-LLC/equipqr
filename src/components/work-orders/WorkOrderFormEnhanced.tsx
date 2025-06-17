
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Lock, Package, AlertTriangle } from "lucide-react";
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { getEquipmentByOrganization, getEquipmentById, WorkOrder } from '@/services/dataService';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0, "Hours must be positive").optional(),
  status: z.enum(['submitted', 'accepted', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled']),
});

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface WorkOrderFormEnhancedProps {
  open: boolean;
  onClose: () => void;
  workOrder?: WorkOrder;
  equipmentId?: string;
  onSubmit?: (data: WorkOrderFormData) => void;
}

const WorkOrderFormEnhanced: React.FC<WorkOrderFormEnhancedProps> = ({ 
  open, 
  onClose, 
  workOrder, 
  equipmentId,
  onSubmit 
}) => {
  const isEdit = !!workOrder;
  const { currentOrganization } = useSimpleOrganization();
  const permissions = useUnifiedPermissions();
  
  // Get equipment data
  const allEquipment = currentOrganization ? getEquipmentByOrganization(currentOrganization.id) : [];
  const preSelectedEquipment = equipmentId && currentOrganization ? 
    getEquipmentById(currentOrganization.id, equipmentId) : null;

  const initialValues: Partial<WorkOrderFormData> = {
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    equipmentId: workOrder?.equipmentId || equipmentId || '',
    priority: workOrder?.priority || 'medium',
    assigneeId: workOrder?.assigneeId || '',
    teamId: workOrder?.teamId || '',
    dueDate: workOrder?.dueDate || '',
    estimatedHours: workOrder?.estimatedHours || undefined,
    status: workOrder?.status || 'submitted',
  };

  const form = useFormValidation(workOrderFormSchema, initialValues);

  const { execute: submitForm, isLoading: isSubmitting } = useAsyncOperation(
    async (data: WorkOrderFormData) => {
      if (onSubmit) {
        await onSubmit(data);
      }
    },
    {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    }
  );

  const workOrderPermissions = permissions.workOrders.getPermissions(workOrder);

  const handleSubmit = async () => {
    await form.handleSubmit(submitForm);
  };

  const handleClose = () => {
    if (Object.keys(form.values).length > 0 && !isEdit) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    form.reset();
    onClose();
  };

  const renderEquipmentField = () => {
    if (preSelectedEquipment) {
      return (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Equipment *
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{preSelectedEquipment.name}</div>
              <div className="text-sm text-muted-foreground">
                {preSelectedEquipment.manufacturer} {preSelectedEquipment.model} • {preSelectedEquipment.serialNumber}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Pre-selected
            </Badge>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>Equipment *</Label>
        <Select 
          value={form.values.equipmentId as string} 
          onValueChange={(value) => form.setValue('equipmentId', value)}
          disabled={isEdit && !workOrderPermissions.canEdit}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            {allEquipment.map((equipment) => (
              <SelectItem key={equipment.id} value={equipment.id}>
                <div className="flex flex-col">
                  <span>{equipment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {equipment.manufacturer} {equipment.model} • {equipment.location}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.errors.equipmentId && (
          <p className="text-sm text-destructive">{form.errors.equipmentId}</p>
        )}
      </div>
    );
  };

  if (!permissions.context) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Service Unavailable
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load permissions. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!workOrderPermissions.canEdit && isEdit) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Access Restricted
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to edit this work order. Only organization admins and team managers can edit work orders.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Work Order' : 'Create New Work Order'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update work order information' : 
               preSelectedEquipment ? 
                 `Create a new work order for ${preSelectedEquipment.name}` :
                 'Enter the details for the new work order'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Work Order Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder={preSelectedEquipment ? 
                        `Maintenance for ${preSelectedEquipment.name}` : 
                        "e.g., Annual maintenance for Forklift FL-001"
                      }
                      value={form.values.title as string || ''}
                      onChange={(e) => form.setValue('title', e.target.value)}
                      disabled={isEdit && !workOrderPermissions.canEdit}
                    />
                    {form.errors.title && (
                      <p className="text-sm text-destructive">{form.errors.title}</p>
                    )}
                  </div>

                  {renderEquipmentField()}

                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select 
                      value={form.values.priority as string}
                      onValueChange={(value) => form.setValue('priority', value)}
                      disabled={isEdit && !workOrderPermissions.canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.errors.priority && (
                      <p className="text-sm text-destructive">{form.errors.priority}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Hours</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 4"
                      min="0"
                      step="0.5"
                      value={form.values.estimatedHours || ''}
                      onChange={(e) => form.setValue('estimatedHours', e.target.value ? Number(e.target.value) : undefined)}
                      disabled={isEdit && !workOrderPermissions.canEdit}
                    />
                    {form.errors.estimatedHours && (
                      <p className="text-sm text-destructive">{form.errors.estimatedHours}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assignment and Dates */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Assignment & Scheduling
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select 
                      value={form.values.assigneeId as string || ''}
                      onValueChange={(value) => form.setValue('assigneeId', value)}
                      disabled={isEdit && !workOrderPermissions.canAssign}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No assignee</SelectItem>
                        <SelectItem value="john-smith">John Smith</SelectItem>
                        <SelectItem value="sarah-davis">Sarah Davis</SelectItem>
                        <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                        <SelectItem value="lisa-wilson">Lisa Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select 
                      value={form.values.teamId as string || ''}
                      onValueChange={(value) => form.setValue('teamId', value)}
                      disabled={isEdit && !workOrderPermissions.canAssign}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No team</SelectItem>
                        <SelectItem value="maintenance">Maintenance Team</SelectItem>
                        <SelectItem value="operations">Operations Team</SelectItem>
                        <SelectItem value="safety">Safety Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={form.values.dueDate as string || ''}
                      onChange={(e) => form.setValue('dueDate', e.target.value)}
                      disabled={isEdit && !workOrderPermissions.canEdit}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={form.values.status as string}
                      onValueChange={(value) => form.setValue('status', value)}
                      disabled={isEdit && !workOrderPermissions.canChangeStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder={preSelectedEquipment ? 
                  `Describe the maintenance work needed for ${preSelectedEquipment.name}...` :
                  "Detailed description of the work to be performed..."
                }
                className="min-h-[120px]"
                value={form.values.description as string || ''}
                onChange={(e) => form.setValue('description', e.target.value)}
                disabled={isEdit && !workOrderPermissions.canEdit}
              />
              {form.errors.description && (
                <p className="text-sm text-destructive">{form.errors.description}</p>
              )}
            </div>

            {/* General Error */}
            {form.errors.general && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {form.errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !form.isValid || (isEdit && !workOrderPermissions.canEdit)}
              >
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Work Order' : 'Create Work Order')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default WorkOrderFormEnhanced;
