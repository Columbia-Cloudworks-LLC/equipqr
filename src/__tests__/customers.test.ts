
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerService } from '@/services/customerService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Customer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have CRUD methods defined', () => {
    expect(customerService.getCustomers).toBeDefined();
    expect(customerService.createCustomer).toBeDefined();
    expect(customerService.updateCustomer).toBeDefined();
    expect(customerService.deleteCustomer).toBeDefined();
    expect(customerService.getCustomerContacts).toBeDefined();
  });

  it('should create customer service instance', () => {
    expect(customerService).toBeDefined();
    expect(typeof customerService.getCustomers).toBe('function');
  });
});
