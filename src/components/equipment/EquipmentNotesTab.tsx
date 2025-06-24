
import React from 'react';
import EnhancedEquipmentNotesTab from './EnhancedEquipmentNotesTab';

interface EquipmentNotesTabProps {
  equipmentId: string;
  organizationId: string;
  equipmentTeamId?: string;
}

const EquipmentNotesTab: React.FC<EquipmentNotesTabProps> = (props) => {
  return <EnhancedEquipmentNotesTab {...props} />;
};

export default EquipmentNotesTab;
