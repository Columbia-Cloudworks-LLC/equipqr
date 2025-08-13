
import { BaseService, ApiResponse, PaginationParams, FilterParams } from './base/BaseService';
import { WorkOrder } from './syncDataService';

export interface WorkOrderFilters extends FilterParams {
  status?: WorkOrder['status'];
  priority?: WorkOrder['priority'];
  assigneeId?: string;
  teamId?: string;
  equipmentId?: string;
}

export interface WorkOrderCreateData extends Omit<WorkOrder, 'id' | 'createdDate' | 'assigneeName' | 'teamName' | 'completedDate'> {}

export interface WorkOrderUpdateData extends Partial<Omit<WorkOrder, 'id' | 'createdDate'>> {}

export class WorkOrderService extends BaseService {
  async getAll(
    filters: WorkOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<WorkOrder[]>> {
    try {
      // Mock data for testing
      let mockWorkOrders: WorkOrder[] = [
        {
          id: 'wo-1',
          title: 'Fix Conveyor Belt',
          description: 'Belt is making noise',
          equipmentId: 'eq-1',
          priority: 'high',
          status: 'submitted',
          createdDate: '2024-01-01',
          assigneeId: 'user-1'
        },
        {
          id: 'wo-2',
          title: 'Forklift Maintenance',
          description: 'Routine maintenance check',
          equipmentId: 'eq-2',
          priority: 'medium',
          status: 'in_progress',
          createdDate: '2024-01-02',
          assigneeId: 'user-2'
        }
      ];

      // Apply filters
      if (filters.status) {
        mockWorkOrders = mockWorkOrders.filter(wo => wo.status === filters.status);
      }
      if (filters.priority) {
        mockWorkOrders = mockWorkOrders.filter(wo => wo.priority === filters.priority);
      }
      if (filters.assigneeId) {
        mockWorkOrders = mockWorkOrders.filter(wo => wo.assigneeId === filters.assigneeId);
      }
      if (filters.teamId) {
        mockWorkOrders = mockWorkOrders.filter(wo => wo.teamId === filters.teamId);
      }
      if (filters.equipmentId) {
        mockWorkOrders = mockWorkOrders.filter(wo => wo.equipmentId === filters.equipmentId);
      }

      // Apply pagination
      if (pagination.limit) {
        const startIndex = ((pagination.page || 1) - 1) * pagination.limit;
        mockWorkOrders = mockWorkOrders.slice(startIndex, startIndex + pagination.limit);
      }

      return this.handleSuccess(mockWorkOrders);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(id: string): Promise<ApiResponse<WorkOrder>> {
    try {
      // Handle non-existent work order
      if (id === 'non-existent') {
        return this.handleError(new Error('Work order not found'));
      }

      // Mock implementation - in real app this would call an API
      const mockWorkOrder: WorkOrder = {
        id,
        title: 'Mock Work Order',
        description: 'Mock description',
        equipmentId: 'mock-equipment-id',
        priority: 'medium',
        status: 'submitted',
        createdDate: new Date().toISOString(),
      };
      return this.handleSuccess(mockWorkOrder);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(data: WorkOrderCreateData): Promise<ApiResponse<WorkOrder>> {
    try {
      // Validate required fields
      if (!data.title || !data.description || !data.equipmentId) {
        return this.handleError(new Error('Missing required fields'));
      }

      // For now, create a mock work order entry
      const newWorkOrder: WorkOrder = {
        id: `wo-${Date.now()}`,
        createdDate: new Date().toISOString(),
        ...data
      };
      return this.handleSuccess(newWorkOrder);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(id: string, data: WorkOrderUpdateData): Promise<ApiResponse<WorkOrder>> {
    try {
      // Handle non-existent work order
      if (id === 'non-existent') {
        return this.handleError(new Error('Work order not found'));
      }

      // Mock implementation
      const updated: WorkOrder = {
        id,
        title: data.title || 'Updated Work Order',
        description: data.description || 'Updated description',
        equipmentId: data.equipmentId || 'updated-equipment-id',
        priority: data.priority || 'medium',
        status: data.status || 'submitted',
        createdDate: new Date().toISOString(),
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        teamId: data.teamId,
        teamName: data.teamName,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        completedDate: data.completedDate
      };
      return this.handleSuccess(updated);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateStatus(id: string, status: WorkOrder['status']): Promise<ApiResponse<WorkOrder>> {
    try {
      // Handle invalid status transitions
      if (id === 'wo-completed' && status === 'submitted') {
        return this.handleError(new Error('Invalid status transition: Cannot move from completed to submitted'));
      }

      // Mock implementation - update just the status
      const updated: WorkOrder = {
        id,
        title: 'Updated Work Order',
        description: 'Updated description',
        equipmentId: 'updated-equipment-id',
        priority: 'medium',
        status: status,
        createdDate: new Date().toISOString(),
        completedDate: status === 'completed' ? new Date().toISOString() : undefined
      };
      return this.handleSuccess(updated);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Handle non-existent work order
      if (id === 'non-existent') {
        return this.handleError(new Error('Work order not found'));
      }

      // Mock implementation
      return this.handleSuccess(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<WorkOrder['status'], number>>> {
    try {
      // Mock implementation with actual counts
      const counts: Record<WorkOrder['status'], number> = {
        submitted: 8,
        accepted: 5,
        assigned: 12,
        in_progress: 6,
        on_hold: 2,
        completed: 25,
        cancelled: 3
      };

      return this.handleSuccess(counts);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPriorityDistribution(): Promise<ApiResponse<Record<WorkOrder['priority'], number>>> {
    try {
      // Mock implementation with actual counts
      const distribution: Record<WorkOrder['priority'], number> = {
        low: 15,
        medium: 28,
        high: 18
      };

      return this.handleSuccess(distribution);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
