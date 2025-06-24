import React from 'react';
import WorkOrderFormEnhanced from './WorkOrderFormEnhanced';

interface WorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  equipmentId?: string;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = (props) => {
  return <WorkOrderFormEnhanced {...props} />;
};

export default WorkOrderForm;
