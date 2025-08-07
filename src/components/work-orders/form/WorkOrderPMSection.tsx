import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Wrench, Info, CheckCircle2 } from "lucide-react";
import { WorkOrderFormData } from '@/hooks/useWorkOrderForm';
import { defaultForkliftChecklist } from '@/services/preventativeMaintenanceService';

interface WorkOrderPMSectionProps {
  values: WorkOrderFormData;
  setValue: (field: keyof WorkOrderFormData, value: unknown) => void;
}

export const WorkOrderPMSection: React.FC<WorkOrderPMSectionProps> = ({
  values,
  setValue
}) => {
  return (
    <>
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
        <Checkbox
          id="hasPM"
          checked={values.hasPM}
          onCheckedChange={(checked) => setValue('hasPM', checked as boolean)}
        />
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <Label htmlFor="hasPM" className="text-sm font-medium cursor-pointer">
            Include Preventative Maintenance
          </Label>
        </div>
      </div>

      {values.hasPM && (
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This work order will include a preventative maintenance checklist that must be completed before the work order can be marked as finished.
            </AlertDescription>
          </Alert>
          
          <div className="bg-muted/30 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">PM Checklist Preview</span>
              <span className="text-xs text-muted-foreground">({defaultForkliftChecklist.length} items)</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Visual Inspection (5 items)</div>
              <div>• Engine Compartment (5 items)</div>
              <div>• Electrical Inspection (3 items)</div>
              <div>• Operational Check (4 items)</div>
              <div>• Safety Features (3 items)</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};