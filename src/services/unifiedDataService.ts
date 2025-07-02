
// Unified data service that uses Supabase as the primary data source
export type {
  Equipment,
  Note,
  WorkOrder,
  Scan,
  Team,
  TeamMember,
  WorkOrderCost,
  DashboardStats
} from './supabaseDataService';

export {
  getEquipmentByOrganization,
  getEquipmentById,
  getTeamsByOrganization,
  getDashboardStatsByOrganization,
  getNotesByEquipmentId,  
  getWorkOrdersByEquipmentId,
  getAllWorkOrdersByOrganization,
  getWorkOrderById,
  getScansByEquipmentId,
  updateWorkOrderStatus,
  createEquipment,
  createWorkOrder,
  createNote
} from './supabaseDataService';
