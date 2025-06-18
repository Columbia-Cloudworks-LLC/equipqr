
// Unified data service that uses Supabase as the primary data source
export {
  Equipment,
  Note,
  WorkOrder,
  Scan,
  Team,
  TeamMember,
  DashboardStats,
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
