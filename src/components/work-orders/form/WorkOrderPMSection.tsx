import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Wrench, Info } from "lucide-react";
import { WorkOrderFormData } from '@/hooks/useWorkOrderForm';

interface WorkOrderPMSectionProps {
  values: WorkOrderFormData;
  setValue: (field: keyof WorkOrderFormData, value: any) => void;
}

export const WorkOrderPMSection: React.FC<WorkOrderPMSectionProps> = ({
  values,
  setValue
}) => {
  return (
    <>
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-blue-50">
        <Checkbox
          id="hasPM"
          checked={values.hasPM}
          onCheckedChange={(checked) => setValue('hasPM', checked as boolean)}
        />
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-600" />
          <Label htmlFor="hasPM" className="text-sm font-medium cursor-pointer">
            Include Preventative Maintenance
          </Label>
        </div>
      </div>

      {values.hasPM && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This work order will include a preventative maintenance checklist that must be completed before the work order can be marked as finished.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};