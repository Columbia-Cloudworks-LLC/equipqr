import React from 'react';
import { Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { WorkOrderFormData } from '@/hooks/useWorkOrderForm';

interface WorkOrderEquipmentSelectorProps {
  values: WorkOrderFormData;
  errors: Record<string, string>;
  setValue: (field: keyof WorkOrderFormData, value: any) => void;
  preSelectedEquipment?: any;
  allEquipment: any[];
  isEditMode: boolean;
  isEquipmentPreSelected: boolean;
}

export const WorkOrderEquipmentSelector: React.FC<WorkOrderEquipmentSelectorProps> = ({
  values,
  errors,
  setValue,
  preSelectedEquipment,
  allEquipment,
  isEditMode,
  isEquipmentPreSelected
}) => {
  if (isEquipmentPreSelected) {
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
        value={values.equipmentId} 
        onValueChange={(value) => setValue('equipmentId', value)}
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
      {errors.equipmentId && (
        <p className="text-sm text-destructive">{errors.equipmentId}</p>
      )}
    </div>
  );
};