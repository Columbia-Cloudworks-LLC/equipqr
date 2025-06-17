
import { BaseService, ApiResponse, PaginationParams, FilterParams } from './base/BaseService';
import { Equipment } from './dataService';
import { getEquipmentByOrganization, getEquipmentById, createEquipment } from './dataService';

export interface EquipmentFilters extends FilterParams {
  status?: Equipment['status'];
  location?: string;
  manufacturer?: string;
  model?: string;
}

export interface EquipmentCreateData extends Omit<Equipment, 'id'> {}

export interface EquipmentUpdateData extends Partial<Omit<Equipment, 'id'>> {}

export class EquipmentService extends BaseService {
  async getAll(
    filters: EquipmentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Equipment[]>> {
    try {
      let equipment = getEquipmentByOrganization(this.organizationId);

      // Apply filters
      if (filters.status) {
        equipment = equipment.filter(item => item.status === filters.status);
      }
      if (filters.location) {
        equipment = equipment.filter(item => 
          item.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters.manufacturer) {
        equipment = equipment.filter(item => 
          item.manufacturer.toLowerCase().includes(filters.manufacturer!.toLowerCase())
        );
      }
      if (filters.model) {
        equipment = equipment.filter(item => 
          item.model.toLowerCase().includes(filters.model!.toLowerCase())
        );
      }

      // Apply sorting
      if (pagination.sortBy) {
        equipment.sort((a, b) => {
          const aValue = a[pagination.sortBy as keyof Equipment] as string;
          const bValue = b[pagination.sortBy as keyof Equipment] as string;
          const comparison = aValue.localeCompare(bValue);
          return pagination.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        equipment = equipment.slice(startIndex, startIndex + pagination.limit);
      }

      return this.handleSuccess(equipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(id: string): Promise<ApiResponse<Equipment>> {
    try {
      const equipment = getEquipmentById(this.organizationId, id);
      if (!equipment) {
        return this.handleError(new Error('Equipment not found'));
      }
      return this.handleSuccess(equipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(data: EquipmentCreateData): Promise<ApiResponse<Equipment>> {
    try {
      const newEquipment = createEquipment(this.organizationId, data);
      if (!newEquipment) {
        return this.handleError(new Error('Failed to create equipment'));
      }
      return this.handleSuccess(newEquipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(id: string, data: EquipmentUpdateData): Promise<ApiResponse<Equipment>> {
    try {
      // For now, we'll simulate an update since the mock service doesn't have update
      const existing = getEquipmentById(this.organizationId, id);
      if (!existing) {
        return this.handleError(new Error('Equipment not found'));
      }

      const updated = { ...existing, ...data };
      return this.handleSuccess(updated);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // For now, we'll simulate a delete since the mock service doesn't have delete
      const existing = getEquipmentById(this.organizationId, id);
      if (!existing) {
        return this.handleError(new Error('Equipment not found'));
      }
      return this.handleSuccess(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<Equipment['status'], number>>> {
    try {
      const equipment = getEquipmentByOrganization(this.organizationId);
      const counts = equipment.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<Equipment['status'], number>);

      // Ensure all statuses are represented
      const allStatuses: Equipment['status'][] = ['active', 'maintenance', 'inactive'];
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
}
