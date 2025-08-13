import { vi } from 'vitest';

// Mock Supabase client with proper chain structure
export const createMockSupabaseClient = () => {
  const createMockChain = () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      nullsFirst: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    
    // Make all chain methods return the same mock object for proper chaining
    Object.keys(chain).forEach(key => {
      if (key !== 'single' && key !== 'then') {
        chain[key].mockReturnValue(chain);
      }
    });
    
    return chain;
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => createMockChain()),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
  };
};

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
  default_pm_template_id: null,
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