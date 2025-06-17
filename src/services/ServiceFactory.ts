
import { EquipmentService } from './EquipmentService';
import { WorkOrderService } from './WorkOrderService';

export class ServiceFactory {
  private static equipmentServices = new Map<string, EquipmentService>();
  private static workOrderServices = new Map<string, WorkOrderService>();

  static getEquipmentService(organizationId: string): EquipmentService {
    if (!this.equipmentServices.has(organizationId)) {
      this.equipmentServices.set(organizationId, new EquipmentService(organizationId));
    }
    return this.equipmentServices.get(organizationId)!;
  }

  static getWorkOrderService(organizationId: string): WorkOrderService {
    if (!this.workOrderServices.has(organizationId)) {
      this.workOrderServices.set(organizationId, new WorkOrderService(organizationId));
    }
    return this.workOrderServices.get(organizationId)!;
  }

  static clearCache(organizationId?: string) {
    if (organizationId) {
      this.equipmentServices.delete(organizationId);
      this.workOrderServices.delete(organizationId);
    } else {
      this.equipmentServices.clear();
      this.workOrderServices.clear();
    }
  }

  static getAllServices(organizationId: string) {
    return {
      equipment: this.getEquipmentService(organizationId),
      workOrders: this.getWorkOrderService(organizationId)
    };
  }
}
