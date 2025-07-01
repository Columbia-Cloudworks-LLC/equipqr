
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
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Info, Wrench } from "lucide-react";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useSyncEquipmentByOrganization, useSyncEquipmentById } from '@/services/syncDataService';
import { useCreateWorkOrderEnhanced, EnhancedCreateWorkOrderData } from '@/hooks/useWorkOrderCreationEnhanced';
import { useUpdateWorkOrder, UpdateWorkOrderData } from '@/hooks/useWorkOrderUpdate';
import { useWorkOrderAssignment } from '@/hooks/useWorkOrderAssignment';
import { WorkOrder } from '@/services/supabaseDataService';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  hasPM: z.boolean().default(false),
  assignmentType: z.enum(['unassigned', 'user', 'team']).optional(),
  assignmentId: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface WorkOrderFormEnhancedProps {
  open: boolean;
  onClose: () => void;
  equipmentId?: string;
  workOrder?: WorkOrder; // Add workOrder prop for edit mode
  onSubmit?: (data: WorkOrderFormData) => void;
}

const WorkOrderFormEnhanced: React.FC<WorkOrderFormEnhancedProps> = ({ 
  open, 
  onClose, 
  equipmentId,
  workOrder, // Edit mode when this is provided
  onSubmit 
}) => {
  const { currentOrganization } = useOrganization();
  const createWorkOrderMutation = useCreateWorkOrderEnhanced();
  const updateWorkOrderMutation = useUpdateWorkOrder();
  
  const { data: allEquipment = [] } = useSyncEquipmentByOrganization(currentOrganization?.id);
  const { data: preSelectedEquipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    equipmentId || workOrder?.equipment_id || ''
  );

  const isEditMode = !!workOrder;

  const initialValues: Partial<WorkOrderFormData> = {
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    equipmentId: workOrder?.equipment_id || equipmentId || '',
    priority: workOrder?.priority || 'medium',
    dueDate: workOrder?.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : '',
    estimatedHours: workOrder?.estimated_hours || undefined,
    hasPM: workOrder?.has_pm || false,
    assignmentType: 'unassigned',
    assignmentId: '',
  };

  const form = useFormValidation(workOrderFormSchema, initialValues);

  // Reset form when workOrder changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open, workOrder]);

  // Get assignment data for auto-assignment suggestions
  const assignmentData = useWorkOrderAssignment(
    currentOrganization?.id || '', 
    form.values.equipmentId as string || equipmentId || workOrder?.equipment_id
  );

  const { execute: submitForm, isLoading: isSubmitting } = useAsyncOperation(
    async (data: WorkOrderFormData) => {
      if (onSubmit) {
        await onSubmit(data);
      } else if (isEditMode && workOrder) {
        // Update existing work order
        const updateData: UpdateWorkOrderData = {
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          estimatedHours: data.estimatedHours,
          hasPM: data.hasPM,
        };
        
        await updateWorkOrderMutation.mutateAsync({
          workOrderId: workOrder.id,
          data: updateData
        });
      } else {
        // Create new work order
        const workOrderData: EnhancedCreateWorkOrderData = {
          title: data.title,
          description: data.description,
          equipmentId: data.equipmentId,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          estimatedHours: data.estimatedHours,
          hasPM: data.hasPM,
          assignmentType: data.assignmentType === 'unassigned' ? undefined : data.assignmentType,
          assignmentId: data.assignmentType === 'unassigned' ? undefined : data.assignmentId,
        };
        
        await createWorkOrderMutation.mutateAsync(workOrderData);
      }
    },
    {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    }
  );

  const handleSubmit = async () => {
    await form.handleSubmit(submitForm);
  };

  const handleClose = () => {
    if (Object.keys(form.values).some(key => form.values[key as keyof WorkOrderFormData] !== initialValues[key as keyof WorkOrderFormData])) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    form.reset();
    onClose();
  };

  function renderEquipmentField() {
    if (preSelectedEquipment || isEditMode) {
      const equipment = preSelectedEquipment;
      if (!equipment) return null;

      return (
        <div className="space-y-2">
          <Label>Equipment</Label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{equipment.name}</div>
              <div className="text-sm text-muted-foreground">
                {equipment.manufacturer} {equipment.model} • {equipment.serial_number}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {isEditMode ? 'Current' : 'Selected'}
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
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 
              `Update the work order details` :
              (preSelectedEquipment ? 
                `Create a new work order for ${preSelectedEquipment.name}` :
                'Create a new work order for your equipment'
              )
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                    "Brief description of the work needed"
                  }
                  value={form.values.title as string || ''}
                  onChange={(e) => form.setValue('title', e.target.value)}
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
                  onValueChange={(value) => form.setValue('priority', value as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Low Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        High Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.errors.priority && (
                  <p className="text-sm text-destructive">{form.errors.priority}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={form.values.dueDate as string || ''}
                    onChange={(e) => form.setValue('dueDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={form.values.estimatedHours as number || ''}
                    onChange={(e) => form.setValue('estimatedHours', parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>

              {/* PM Checkbox */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-blue-50">
                <Checkbox
                  id="hasPM"
                  checked={form.values.hasPM as boolean}
                  onCheckedChange={(checked) => form.setValue('hasPM', checked as boolean)}
                />
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="hasPM" className="text-sm font-medium cursor-pointer">
                    Include Preventative Maintenance
                  </Label>
                </div>
              </div>

              {form.values.hasPM && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This work order will include a preventative maintenance checklist that must be completed before the work order can be marked as finished.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder={preSelectedEquipment ? 
                `Describe the work needed for ${preSelectedEquipment.name}. Include any specific requirements, safety considerations, or special instructions...` :
                "Provide detailed information about the work needed, including any specific requirements, safety considerations, or special instructions..."
              }
              className="min-h-[120px]"
              value={form.values.description as string || ''}
              onChange={(e) => form.setValue('description', e.target.value)}
            />
            {form.errors.description && (
              <p className="text-sm text-destructive">{form.errors.description}</p>
            )}
          </div>

          {!isEditMode && assignmentData.suggestedTeamName && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This work order will be automatically assigned to <strong>{assignmentData.suggestedTeamName}</strong> based on the selected equipment.
              </AlertDescription>
            </Alert>
          )}

          {form.errors.general && (
            <Alert variant="destructive">
              <AlertDescription>
                {form.errors.general}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !form.isValid || createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending}
            >
              {(isSubmitting || createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending) ? 
                (isEditMode ? 'Updating...' : 'Creating...') : 
                (isEditMode ? 'Update Work Order' : 'Create Work Order')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderFormEnhanced;
