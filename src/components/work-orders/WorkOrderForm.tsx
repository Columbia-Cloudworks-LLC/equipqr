
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Package } from "lucide-react";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSyncEquipmentByOrganization, useSyncEquipmentById } from '@/services/syncDataService';

interface WorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  workOrder?: any;
  equipmentId?: string;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ open, onClose, workOrder, equipmentId }) => {
  const isEdit = !!workOrder;
  const { currentOrganization } = useOrganization();
  
  // Get equipment data using sync hooks
  const { data: allEquipment = [] } = useSyncEquipmentByOrganization(currentOrganization?.id);
  const { data: preSelectedEquipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    equipmentId || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Work order form submitted');
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
          <p className="text-xs text-muted-foreground">
            Equipment is pre-selected from the equipment details page
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor="equipment">Equipment *</Label>
        <Select defaultValue={workOrder?.equipment}>
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
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Work Order Details
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder={preSelectedEquipment ? 
                      `Maintenance for ${preSelectedEquipment.name}` : 
                      "e.g., Annual maintenance for Forklift FL-001"
                    }
                    defaultValue={workOrder?.title}
                    required
                  />
                </div>

                {renderEquipmentField()}

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select defaultValue={workOrder?.priority || 'medium'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    placeholder="e.g., 4"
                    defaultValue={workOrder?.estimatedHours}
                    min="0"
                    step="0.5"
                  />
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
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select defaultValue={workOrder?.assignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-smith">John Smith</SelectItem>
                      <SelectItem value="sarah-davis">Sarah Davis</SelectItem>
                      <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                      <SelectItem value="lisa-wilson">Lisa Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance Team</SelectItem>
                      <SelectItem value="operations">Operations Team</SelectItem>
                      <SelectItem value="safety">Safety Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    defaultValue={workOrder?.dueDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={workOrder?.status || 'submitted'}>
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder={preSelectedEquipment ? 
                `Describe the maintenance work needed for ${preSelectedEquipment.name}...` :
                "Detailed description of the work to be performed..."
              }
              className="min-h-[120px]"
              defaultValue={workOrder?.description}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? 'Update Work Order' : 'Create Work Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderForm;
