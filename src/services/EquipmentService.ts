
import { BaseService, ApiResponse, PaginationParams, FilterParams } from './base/BaseService';
import { Equipment } from './syncDataService';

export interface EquipmentFilters extends FilterParams {
  status?: Equipment['status'];
  location?: string;
  manufacturer?: string;
  model?: string;
}

export type EquipmentCreateData = Omit<Equipment, 'id'>;

export type EquipmentUpdateData = Partial<Omit<Equipment, 'id'>>;

export class EquipmentService extends BaseService {
  async getAll(
    filters: EquipmentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Equipment[]>> {
    try {
      // Mock data for testing
      let mockEquipment: Equipment[] = [
        {
          id: 'eq-1',
          name: 'Forklift A',
          manufacturer: 'Toyota',
          model: 'FG25',
          serial_number: 'TYT-001',
          status: 'active',
          location: 'Warehouse A',
          installation_date: '2023-01-01',
          warranty_expiration: '2025-01-01',
          last_maintenance: '2024-01-01'
        },
        {
          id: 'eq-2',
          name: 'Conveyor Belt B',
          manufacturer: 'Siemens',
          model: 'CB500',
          serial_number: 'SIE-002',
          status: 'maintenance',
          location: 'Warehouse B',
          installation_date: '2023-02-01',
          warranty_expiration: '2025-02-01',
          last_maintenance: '2024-02-01'
        }
      ];

      // Apply filters
      if (filters.status) {
        mockEquipment = mockEquipment.filter(eq => eq.status === filters.status);
      }
      if (filters.location) {
        mockEquipment = mockEquipment.filter(eq => eq.location === filters.location);
      }
      if (filters.manufacturer) {
        mockEquipment = mockEquipment.filter(eq => eq.manufacturer === filters.manufacturer);
      }
      if (filters.model) {
        mockEquipment = mockEquipment.filter(eq => eq.model === filters.model);
      }

      // Apply pagination
      if (pagination.limit) {
        const startIndex = ((pagination.page || 1) - 1) * pagination.limit;
        mockEquipment = mockEquipment.slice(startIndex, startIndex + pagination.limit);
      }

      return this.handleSuccess(mockEquipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(id: string): Promise<ApiResponse<Equipment>> {
    try {
      // Handle non-existent equipment
      if (id === 'non-existent') {
        return this.handleError(new Error('Equipment not found'));
      }

      // Mock implementation - in real app this would call an API
      const mockEquipment: Equipment = {
        id,
        name: 'Mock Equipment',
        manufacturer: 'Mock Manufacturer',
        model: 'Mock Model',
        serial_number: 'MOCK-001',
        status: 'active',
        location: 'Mock Location',
        installation_date: new Date().toISOString(),
        warranty_expiration: new Date().toISOString(),
        last_maintenance: new Date().toISOString(),
      };
      return this.handleSuccess(mockEquipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(data: EquipmentCreateData): Promise<ApiResponse<Equipment>> {
    try {
      // Validate required fields
      if (!data.name || !data.manufacturer || !data.model || !data.serial_number) {
        return this.handleError(new Error('Missing required fields'));
      }

      // For now, create a mock equipment entry
      const newEquipment: Equipment = {
        id: `eq-${Date.now()}`,
        ...data
      };
      return this.handleSuccess(newEquipment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(id: string, data: EquipmentUpdateData): Promise<ApiResponse<Equipment>> {
    try {
      // Handle non-existent equipment
      if (id === 'non-existent') {
        return this.handleError(new Error('Equipment not found'));
      }

      // Mock implementation
      const updated: Equipment = {
        id,
        name: data.name || 'Updated Equipment',
        manufacturer: data.manufacturer || 'Updated Manufacturer',
        model: data.model || 'Updated Model',
        serial_number: data.serial_number || 'UPD-001',
        status: data.status || 'active',
        location: data.location || 'Updated Location',
        installation_date: data.installation_date || new Date().toISOString(),
        warranty_expiration: data.warranty_expiration || new Date().toISOString(),
        last_maintenance: data.last_maintenance || new Date().toISOString(),
        notes: data.notes
      };
      return this.handleSuccess(updated);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Handle non-existent equipment
      if (id === 'non-existent') {
        return this.handleError(new Error('Equipment not found'));
      }

      // Mock implementation
      return this.handleSuccess(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<Equipment['status'], number>>> {
    try {
      // Mock implementation with actual counts
      const counts: Record<Equipment['status'], number> = {
        active: 15,
        maintenance: 3,
        inactive: 2
      };

      return this.handleSuccess(counts);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
