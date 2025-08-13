import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EquipmentService } from '../EquipmentService';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(() => {
    service = new EquipmentService('test-org');
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all equipment successfully', async () => {
      const result = await service.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should filter equipment by status', async () => {
      const result = await service.getAll({ status: 'active' });
      
      expect(result.success).toBe(true);
      expect(result.data.every(eq => eq.status === 'active')).toBe(true);
    });

    it('should filter equipment by location', async () => {
      const location = 'Warehouse A';
      const result = await service.getAll({ location });
      
      expect(result.success).toBe(true);
      expect(result.data.every(eq => eq.location === location)).toBe(true);
    });

    it('should apply pagination correctly', async () => {
      const result = await service.getAll({}, { page: 1, limit: 2 });
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getById', () => {
    it('should fetch equipment by id successfully', async () => {
      const result = await service.getById('eq-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('eq-1');
    });

    it('should handle non-existent equipment', async () => {
      const result = await service.getById('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create equipment successfully', async () => {
      const equipmentData = {
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        serial_number: '12345',
        status: 'active' as const,
        location: 'Test Location',
        installation_date: '2024-01-01',
        warranty_expiration: '2025-01-01',
        last_maintenance: '2024-01-01'
      };

      const result = await service.create(equipmentData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(equipmentData.name);
    });

    it('should validate required fields', async () => {
      interface IncompleteEquipmentData {
        name: string;
        status: 'active';
        location: string;
        installation_date: string;
        warranty_expiration: string;
        last_maintenance: string;
        // Missing required fields like manufacturer, model, serial_number
      }
      
      const incompleteData: IncompleteEquipmentData = {
        name: 'Test Equipment',
        status: 'active' as const,
        location: 'Test Location',
        installation_date: '2024-01-01',
        warranty_expiration: '2025-01-01',
        last_maintenance: '2024-01-01'
      };

      const result = await service.create(incompleteData as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update equipment successfully', async () => {
      const updateData = {
        name: 'Updated Equipment',
        status: 'maintenance' as const
      };

      const result = await service.update('eq-1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.status).toBe(updateData.status);
    });

    it('should handle non-existent equipment update', async () => {
      const result = await service.update('non-existent', { name: 'Updated' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete equipment successfully', async () => {
      const result = await service.delete('eq-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should handle non-existent equipment deletion', async () => {
      const result = await service.delete('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStatusCounts', () => {
    it('should return status counts', async () => {
      const result = await service.getStatusCounts();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('active');
      expect(result.data).toHaveProperty('maintenance');
      expect(result.data).toHaveProperty('inactive');
      expect(typeof result.data.active).toBe('number');
    });
  });
});