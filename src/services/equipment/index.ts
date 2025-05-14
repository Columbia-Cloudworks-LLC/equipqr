
// Export individual equipment services
export { getEquipment } from './equipmentListService';
export { getEquipmentById } from './equipmentDetailsService';
export { createEquipment } from './equipmentCreateService';
export { updateEquipment } from './equipmentUpdateService';
export { deleteEquipment } from './equipmentDeleteService';
export { recordScan, getScanHistory } from './scanService';
export { 
  getEquipmentAttributes, 
  saveEquipmentAttributes, 
  deleteEquipmentAttribute 
} from './attributesService';
