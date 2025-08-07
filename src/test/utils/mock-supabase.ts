import { vi } from 'vitest';

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
    })),
  },
});

// Mock data
export const mockEquipment = {
  id: '1',
  name: 'Test Equipment',
  manufacturer: 'Test Manufacturer',
  model: 'Test Model',
  serial_number: 'TEST123',
  status: 'active',
  location: 'Test Location',
  organization_id: 'org-1',
};

export const mockWorkOrder = {
  id: '1',
  title: 'Test Work Order',
  description: 'Test Description',
  equipment_id: '1',
  status: 'submitted',
  priority: 'medium',
  organization_id: 'org-1',
};

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};