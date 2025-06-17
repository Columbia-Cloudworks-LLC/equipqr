
import { BaseService, ApiResponse, PaginationParams, FilterParams } from './base/BaseService';
import { WorkOrder } from './dataService';
import { 
  getAllWorkOrdersByOrganization, 
  getWorkOrderById, 
  getWorkOrdersByEquipmentId,
  updateWorkOrderStatus 
} from './dataService';

export interface WorkOrderFilters extends FilterParams {
  status?: WorkOrder['status'];
  priority?: WorkOrder['priority'];
  equipmentId?: string;
  assigneeId?: string;
  teamId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface WorkOrderCreateData extends Omit<WorkOrder, 'id' | 'createdDate' | 'assigneeName' | 'teamName' | 'completedDate'> {}

export interface WorkOrderUpdateData extends Partial<Omit<WorkOrder, 'id' | 'createdDate'>> {}

export class WorkOrderService extends BaseService {
  async getAll(
    filters: WorkOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<WorkOrder[]>> {
    try {
      let workOrders = getAllWorkOrdersByOrganization(this.organizationId);

      // Apply filters
      if (filters.status) {
        workOrders = workOrders.filter(item => item.status === filters.status);
      }
      if (filters.priority) {
        workOrders = workOrders.filter(item => item.priority === filters.priority);
      }
      if (filters.equipmentId) {
        workOrders = workOrders.filter(item => item.equipmentId === filters.equipmentId);
      }
      if (filters.assigneeId) {
        workOrders = workOrders.filter(item => item.assigneeId === filters.assigneeId);
      }
      if (filters.teamId) {
        workOrders = workOrders.filter(item => item.teamId === filters.teamId);
      }
      if (filters.dateFrom) {
        workOrders = workOrders.filter(item => 
          new Date(item.createdDate) >= new Date(filters.dateFrom!)
        );
      }
      if (filters.dateTo) {
        workOrders = workOrders.filter(item => 
          new Date(item.createdDate) <= new Date(filters.dateTo!)
        );
      }

      // Apply sorting
      if (pagination.sortBy) {
        workOrders.sort((a, b) => {
          let aValue = a[pagination.sortBy as keyof WorkOrder];
          let bValue = b[pagination.sortBy as keyof WorkOrder];
          
          // Handle date sorting
          if (pagination.sortBy === 'createdDate' || pagination.sortBy === 'dueDate') {
            aValue = new Date(aValue as string).getTime();
            bValue = new Date(bValue as string).getTime();
          }
          
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return pagination.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        workOrders = workOrders.slice(startIndex, startIndex + pagination.limit);
      }

      return this.handleSuccess(workOrders);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(id: string): Promise<ApiResponse<WorkOrder>> {
    try {
      const workOrder = getWorkOrderById(this.organizationId, id);
      if (!workOrder) {
        return this.handleError(new Error('Work order not found'));
      }
      return this.handleSuccess(workOrder);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getByEquipmentId(equipmentId: string): Promise<ApiResponse<WorkOrder[]>> {
    try {
      const workOrders = getWorkOrdersByEquipmentId(this.organizationId, equipmentId);
      return this.handleSuccess(workOrders);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateStatus(id: string, status: WorkOrder['status']): Promise<ApiResponse<boolean>> {
    try {
      const success = updateWorkOrderStatus(this.organizationId, id, status);
      if (!success) {
        return this.handleError(new Error('Failed to update work order status'));
      }
      return this.handleSuccess(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<WorkOrder['status'], number>>> {
    try {
      const workOrders = getAllWorkOrdersByOrganization(this.organizationId);
      const counts = workOrders.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<WorkOrder['status'], number>);

      // Ensure all statuses are represented
      const allStatuses: WorkOrder['status'][] = [
        'submitted', 'accepted', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'
      ];
      allStatuses.forEach(status => {
        if (!(status in counts)) {
          counts[status] = 0;
        }
      });

      return this.handleSuccess(counts);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPriorityDistribution(): Promise<ApiResponse<Record<WorkOrder['priority'], number>>> {
    try {
      const workOrders = getAllWorkOrdersByOrganization(this.organizationId);
      const distribution = workOrders.reduce((acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {} as Record<WorkOrder['priority'], number>);

      // Ensure all priorities are represented
      const allPriorities: WorkOrder['priority'][] = ['low', 'medium', 'high'];
      allPriorities.forEach(priority => {
        if (!(priority in distribution)) {
          distribution[priority] = 0;
        }
      });

      return this.handleSuccess(distribution);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
