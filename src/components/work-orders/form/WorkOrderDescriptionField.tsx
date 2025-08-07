import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorkOrderFormFieldProps } from '@/types/workOrderForm';

export function WorkOrderDescriptionField({
  values,
  errors,
  setValue,
  preSelectedEquipment
}: WorkOrderFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Description *</Label>
      <Textarea
        placeholder={preSelectedEquipment ? 
          `Describe the work needed for ${preSelectedEquipment.name}. Include any specific requirements, safety considerations, or special instructions...` :
          "Provide detailed information about the work needed, including any specific requirements, safety considerations, or special instructions..."
        }
        className="min-h-[120px]"
        value={values.description || ''}
        onChange={(e) => setValue('description', e.target.value)}
      />
      {errors.description && (
        <p className="text-sm text-destructive">{errors.description}</p>
      )}
    </div>
  );
}