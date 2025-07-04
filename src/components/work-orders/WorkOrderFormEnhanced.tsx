import React from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkOrderAssignment } from '@/hooks/useWorkOrderAssignment';
import { WorkOrder } from '@/services/supabaseDataService';
import { useWorkOrderForm, WorkOrderFormData } from '@/hooks/useWorkOrderForm';
import { useEquipmentSelection } from '@/hooks/useEquipmentSelection';
import { useWorkOrderSubmission } from '@/hooks/useWorkOrderSubmission';
import { WorkOrderFormHeader } from './form/WorkOrderFormHeader';
import { WorkOrderBasicFields } from './form/WorkOrderBasicFields';
import { WorkOrderEquipmentSelector } from './form/WorkOrderEquipmentSelector';
import { WorkOrderPMSection } from './form/WorkOrderPMSection';
import { WorkOrderDescriptionField } from './form/WorkOrderDescriptionField';
import { WorkOrderFormActions } from './form/WorkOrderFormActions';


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
  workOrder,
  onSubmit 
}) => {
  const { currentOrganization } = useOrganization();
  
  const { form, isEditMode, checkForUnsavedChanges } = useWorkOrderForm({
    workOrder,
    equipmentId,
    isOpen: open
  });

  const { allEquipment, preSelectedEquipment, isEquipmentPreSelected } = useEquipmentSelection({
    equipmentId,
    workOrder
  });

  const { submitForm, isLoading } = useWorkOrderSubmission({
    workOrder,
    onSubmit,
    onSuccess: () => {
      form.reset();
      // Always close modal for edit mode or custom onSubmit
      // For create mode, the hook handles navigation and modal will close when component unmounts
      if (isEditMode || onSubmit) {
        onClose();
      }
    }
  });

  // Get assignment data for auto-assignment suggestions
  const assignmentData = useWorkOrderAssignment(
    currentOrganization?.id || '', 
    form.values.equipmentId as string || equipmentId || workOrder?.equipment_id
  );

  const handleSubmit = async () => {
    await form.handleSubmit(submitForm);
  };

  const handleClose = () => {
    if (checkForUnsavedChanges()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    form.reset();
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WorkOrderFormHeader 
          isEditMode={isEditMode}
          preSelectedEquipment={preSelectedEquipment}
        />

        <div className="space-y-6">
          <WorkOrderBasicFields
            values={form.values}
            errors={form.errors}
            setValue={form.setValue}
            preSelectedEquipment={preSelectedEquipment}
          />

          <WorkOrderEquipmentSelector
            values={form.values}
            errors={form.errors}
            setValue={form.setValue}
            preSelectedEquipment={preSelectedEquipment}
            allEquipment={allEquipment}
            isEditMode={isEditMode}
            isEquipmentPreSelected={isEquipmentPreSelected}
          />

          <WorkOrderPMSection
            values={form.values}
            setValue={form.setValue}
          />

          <WorkOrderDescriptionField
            values={form.values}
            errors={form.errors}
            setValue={form.setValue}
            preSelectedEquipment={preSelectedEquipment}
          />

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

          <WorkOrderFormActions
            onCancel={handleClose}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isValid={form.isValid}
            isEditMode={isEditMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderFormEnhanced;
