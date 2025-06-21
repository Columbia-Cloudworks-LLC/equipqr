
import React, { useState } from 'react';
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Users, User } from "lucide-react";
import { useCreateWorkOrderEnhanced, EnhancedCreateWorkOrderData } from '@/hooks/useWorkOrderCreationEnhanced';
import { useWorkOrderAssignment } from '@/hooks/useWorkOrderAssignment';
import { useEquipmentByOrganization } from '@/hooks/useSupabaseData';
import { useOrganization } from '@/contexts/OrganizationContext';

const workOrderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  equipmentId: z.string().min(1, "Equipment is required"),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  assignmentType: z.enum(['team', 'member', 'unassigned']).optional(),
  assignmentId: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface WorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  equipmentId?: string;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ 
  open, 
  onClose, 
  equipmentId 
}) => {
  const { currentOrganization } = useOrganization();
  const createWorkOrderMutation = useCreateWorkOrderEnhanced();
  const { data: equipment = [] } = useEquipmentByOrganization();

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      equipmentId: equipmentId || '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: undefined,
      assignmentType: 'unassigned',
      assignmentId: '',
    },
  });

  const watchedEquipmentId = form.watch('equipmentId');
  
  // Get assignment data for the selected equipment
  const assignmentData = useWorkOrderAssignment(
    currentOrganization?.id || '', 
    watchedEquipmentId || equipmentId
  );

  const onSubmit = async (values: WorkOrderFormData) => {
    const workOrderData: EnhancedCreateWorkOrderData = {
      title: values.title,
      description: values.description,
      equipmentId: values.equipmentId,
      priority: values.priority,
      dueDate: values.dueDate || undefined,
      estimatedHours: values.estimatedHours || undefined,
      assignmentType: values.assignmentType === 'unassigned' ? undefined : values.assignmentType,
      assignmentId: values.assignmentId || undefined,
    };

    try {
      await createWorkOrderMutation.mutateAsync(workOrderData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting work order:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const selectedEquipment = equipment.find(eq => eq.id === watchedEquipmentId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Order</DialogTitle>
          <DialogDescription>
            Create a new work order for equipment maintenance or repair
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <Input placeholder="e.g., Replace hydraulic filter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="equipmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!equipmentId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select equipment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipment.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.manufacturer} {item.model} • {item.location}
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

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                </CardContent>
              </Card>

              {/* Assignment and Schedule */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Assignment & Schedule
                  </h3>
                  
                  {/* Show equipment team information */}
                  {assignmentData.suggestedTeamName && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This equipment is managed by <strong>{assignmentData.suggestedTeamName}</strong>. 
                        Work orders will be assigned to this team by default.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="assignmentType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Assignment</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="unassigned" id="unassigned" />
                              <Label htmlFor="unassigned">Leave unassigned</Label>
                            </div>
                            
                            {assignmentData.availableAssignees.some(a => a.type === 'team') && (
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="team" id="team" />
                                <Label htmlFor="team" className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Assign to team
                                </Label>
                              </div>
                            )}
                            
                            {assignmentData.availableAssignees.some(a => a.type === 'member') && (
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="member" id="member" />
                                <Label htmlFor="member" className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Assign to specific member
                                </Label>
                              </div>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Assignment Selection */}
                  {(form.watch('assignmentType') === 'team' || form.watch('assignmentType') === 'member') && (
                    <FormField
                      control={form.control}
                      name="assignmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch('assignmentType') === 'team' ? 'Select Team' : 'Select Member'}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${form.watch('assignmentType')}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assignmentData.availableAssignees
                                .filter(assignee => assignee.type === form.watch('assignmentType'))
                                .map((assignee) => (
                                  <SelectItem key={assignee.id} value={assignee.id}>
                                    <div className="flex items-center gap-2">
                                      {assignee.type === 'team' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                      <span>{assignee.name}</span>
                                      {assignee.canSelfAssign && (
                                        <Badge variant="secondary" className="text-xs">You</Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
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
                      placeholder="Describe the work that needs to be done, including any specific requirements or safety considerations..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipment Info Preview */}
            {selectedEquipment && (
              <Card className="bg-muted/20">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Selected Equipment</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedEquipment.name}</p>
                    <p><span className="font-medium">Manufacturer:</span> {selectedEquipment.manufacturer}</p>
                    <p><span className="font-medium">Model:</span> {selectedEquipment.model}</p>
                    <p><span className="font-medium">Location:</span> {selectedEquipment.location}</p>
                    <p><span className="font-medium">Status:</span> {selectedEquipment.status}</p>
                    {assignmentData.suggestedTeamName && (
                      <p><span className="font-medium">Managed by:</span> {assignmentData.suggestedTeamName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createWorkOrderMutation.isPending}
              >
                {createWorkOrderMutation.isPending ? 'Creating...' : 'Create Work Order'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderForm;
