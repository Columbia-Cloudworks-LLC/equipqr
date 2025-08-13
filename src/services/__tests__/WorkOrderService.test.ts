import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkOrderService } from '../WorkOrderService';

describe('WorkOrderService', () => {
  let service: WorkOrderService;

  beforeEach(() => {
    service = new WorkOrderService('test-org');
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all work orders successfully', async () => {
      const result = await service.getAll({}, {});
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should filter work orders by status', async () => {
      const result = await service.getAll({ status: 'submitted' }, {});
      
      expect(result.success).toBe(true);
      expect(result.data.every(wo => wo.status === 'submitted')).toBe(true);
    });

    it('should filter work orders by priority', async () => {
      const result = await service.getAll({ priority: 'high' }, {});
      
      expect(result.success).toBe(true);
      expect(result.data.every(wo => wo.priority === 'high')).toBe(true);
    });

    it('should filter work orders by assignee', async () => {
      const assigneeId = 'user-1';
      const result = await service.getAll({ assigneeId }, {});
      
      expect(result.success).toBe(true);
      expect(result.data.every(wo => wo.assigneeId === assigneeId)).toBe(true);
    });

    it('should apply pagination correctly', async () => {
      const result = await service.getAll({}, { page: 1, limit: 3 });
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getById', () => {
    it('should fetch work order by id successfully', async () => {
      const result = await service.getById('wo-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('wo-1');
    });

    it('should handle non-existent work order', async () => {
      const result = await service.getById('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create work order successfully', async () => {
      const workOrderData = {
        title: 'Test Work Order',
        description: 'Test Description',
        equipmentId: 'eq-1',
        priority: 'medium' as const,
        status: 'submitted' as const
      };

      const result = await service.create(workOrderData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe(workOrderData.title);
      expect(result.data.status).toBe('submitted');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Test Work Order',
        status: 'submitted' as const,
        priority: 'medium' as const
        // Missing required fields like description, equipmentId
      } as any;

      const result = await service.create(incompleteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update work order successfully', async () => {
      const updateData = {
        title: 'Updated Work Order',
        priority: 'high' as const
      };

      const result = await service.update('wo-1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      expect(result.data.priority).toBe(updateData.priority);
    });

    it('should handle non-existent work order update', async () => {
      const result = await service.update('non-existent', { title: 'Updated' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update work order status successfully', async () => {
      const newStatus = 'in_progress';
      const result = await service.updateStatus('wo-1', newStatus);
      
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(newStatus);
    });

    it('should handle invalid status transitions', async () => {
      // Attempt invalid transition (e.g., completed to submitted)
      const result = await service.updateStatus('wo-completed', 'submitted');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status transition');
    });
  });

  describe('delete', () => {
    it('should delete work order successfully', async () => {
      const result = await service.delete('wo-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should handle non-existent work order deletion', async () => {
      const result = await service.delete('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStatusCounts', () => {
    it('should return status counts', async () => {
      const result = await service.getStatusCounts();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('submitted');
      expect(result.data).toHaveProperty('in_progress');
      expect(result.data).toHaveProperty('completed');
      expect(typeof result.data.submitted).toBe('number');
    });
  });

  describe('getPriorityDistribution', () => {
    it('should return priority distribution', async () => {
      const result = await service.getPriorityDistribution();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('low');
      expect(result.data).toHaveProperty('medium');
      expect(result.data).toHaveProperty('high');
      expect(typeof result.data.low).toBe('number');
    });
  });
});