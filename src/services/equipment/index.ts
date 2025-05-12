
// Re-export all equipment-related services
export * from './equipmentListService';
export * from './equipmentDetailsService';
export * from './equipmentCreateService';
export * from './equipmentUpdateService';
export * from './equipmentDeleteService';

// Re-export the scan service for backwards compatibility
export { recordScan } from "../scanService";
