
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Package, AlertTriangle } from "lucide-react";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkOrderPermissions } from '@/hooks/usePermissions';
import { getEquipmentByOrganization, getEquipmentById, WorkOrder } from '@/services/dataService';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
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
  const { currentOrganization } = useOrganization();
  const permissions = useWorkOrderPermissions(workOrder);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Get equipment data
  const allEquipment = currentOrganization ? getEquipmentByOrganization(currentOrganization.id) : [];
  const preSelectedEquipment = equipmentId && currentOrganization ? 
    getEquipmentById(currentOrganization.id, equipmentId) : null;

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      title: workOrder?.title || '',
      description: workOrder?.description || '',
      equipmentId: workOrder?.equipmentId || equipmentId || '',
      priority: workOrder?.priority || 'medium',
      assigneeId: workOrder?.assigneeId || '',
      teamId: workOrder?.teamId || '',
      dueDate: workOrder?.dueDate || '',
      estimatedHours: workOrder?.estimatedHours || undefined,
      status: workOrder?.status || 'submitted',
    }
  });

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (data: WorkOrderFormData) => {
    console.log('Work order form submitted:', data);
    if (onSubmit) {
      onSubmit(data);
    }
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setHasUnsavedChanges(false);
    onClose();
  };

  const renderEquipmentField = () => {
    if (preSelectedEquipment) {
      return (
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            Equipment *
            <Lock className="h-3 w-3 text-muted-foreground" />
          </FormLabel>
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
      <FormField
        control={form.control}
        name="equipmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Equipment *</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isEdit && !permissions.canEdit}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
              </FormControl>
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
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (!permissions.canEdit && isEdit) {
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
              You don't have permission to edit this work order. Only the assignee, team managers, admins, and organization owners can edit work orders.
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Work Order Details
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={preSelectedEquipment ? 
                              `Maintenance for ${preSelectedEquipment.name}` : 
                              "e.g., Annual maintenance for Forklift FL-001"
                            }
                            disabled={isEdit && !permissions.canEdit}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderEquipmentField()}

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isEdit && !permissions.canEditPriority}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 4"
                            min="0"
                            step="0.5"
                            disabled={isEdit && !permissions.canEdit}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Assignment and Dates */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Assignment & Scheduling
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isEdit && !permissions.canEditAssignment}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="john-smith">John Smith</SelectItem>
                            <SelectItem value="sarah-davis">Sarah Davis</SelectItem>
                            <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                            <SelectItem value="lisa-wilson">Lisa Wilson</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isEdit && !permissions.canEditAssignment}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="maintenance">Maintenance Team</SelectItem>
                            <SelectItem value="operations">Operations Team</SelectItem>
                            <SelectItem value="safety">Safety Team</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isEdit && !permissions.canEditDueDate}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isEdit && !permissions.canChangeStatus}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={preSelectedEquipment ? 
                        `Describe the maintenance work needed for ${preSelectedEquipment.name}...` :
                        "Detailed description of the work to be performed..."
                      }
                      className="min-h-[120px]"
                      disabled={isEdit && !permissions.canEditDescription}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission Notice */}
            {isEdit && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some fields may be disabled based on your permissions. 
                  {!permissions.canEditAssignment && " You cannot modify assignments."}
                  {!permissions.canEditPriority && " You cannot change priority."}
                  {!permissions.canChangeStatus && " You cannot change status."}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEdit && !permissions.canEdit}>
                {isEdit ? 'Update Work Order' : 'Create Work Order'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderFormEnhanced;
