import { vi, describe, it, expect, beforeEach } from 'vitest';
import { pmChecklistTemplatesService, generateSectionsSummary, templateToSummary, PMTemplate } from '../pmChecklistTemplatesService';

// Mock Supabase client with proper chain structure
vi.mock('@/integrations/supabase/client', () => {
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
    };
    
    // Make all chain methods return the same mock object for proper chaining
    Object.keys(chain).forEach(key => {
      if (key !== 'single') {
        chain[key].mockReturnValue(chain);
      }
    });
    
    return chain;
  };

  const mockSupabaseClient = {
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
  return { supabase: mockSupabaseClient };
});

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'mock-id-123'
}));

const mockChecklistItem = {
  id: 'item-1',
  title: 'Check Oil',
  description: 'Check engine oil level',
  section: 'Engine',
  condition: null,
  required: true,
  notes: ''
};

const mockTemplate: PMTemplate = {
  id: 'template-1',
  organization_id: 'org-1',
  name: 'Test Template',
  description: 'Test description',
  is_protected: false,
  template_data: [mockChecklistItem],
  created_by: 'user-1',
  updated_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('pmChecklistTemplatesService', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked supabase client from the default export
    const { supabase } = await import('@/integrations/supabase/client');
    mockSupabase = supabase;
  });

  describe('listTemplates', () => {
    it('fetches templates for organization', async () => {
      const mockTemplates = [mockTemplate];
      
      // Mock the chain properly - the or() method should resolve the promise
      const mockChain = mockSupabase.from();
      mockChain.or.mockResolvedValue({
        data: mockTemplates,
        error: null
      });

      const result = await pmChecklistTemplatesService.listTemplates('org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(result).toEqual(mockTemplates);
    });

    it('handles database errors', async () => {
      const mockError = new Error('Database error');
      
      // Mock the chain properly
      const mockChain = mockSupabase.from();
      mockChain.or.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(pmChecklistTemplatesService.listTemplates('org-1')).rejects.toThrow('Database error');
    });
  });

  describe('getTemplate', () => {
    it('fetches template by ID', async () => {
      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const result = await pmChecklistTemplatesService.getTemplate('template-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(result).toEqual(mockTemplate);
    });

    it('returns null when template not found', async () => {
      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await pmChecklistTemplatesService.getTemplate('non-existent');

      expect(result).toBeNull();
    });

    it('throws on database error', async () => {
      const mockError = new Error('Database error');
      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(pmChecklistTemplatesService.getTemplate('template-1')).rejects.toThrow('Database error');
    });
  });

  describe('createTemplate', () => {
    it('creates a new template', async () => {
      const templateData = {
        organizationId: 'org-1',
        name: 'New Template',
        description: 'New description',
        template_data: [mockChecklistItem],
        created_by: 'user-1'
      };

      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const result = await pmChecklistTemplatesService.createTemplate(templateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('updateTemplate', () => {
    it('updates existing template', async () => {
      const updates = {
        name: 'Updated Template',
        description: 'Updated description',
        template_data: [mockChecklistItem],
        updated_by: 'user-1'
      };

      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: { ...mockTemplate, ...updates },
        error: null
      });

      const result = await pmChecklistTemplatesService.updateTemplate('template-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(result).toEqual({ ...mockTemplate, ...updates });
    });
  });

  describe('deleteTemplate', () => {
    it('deletes template by ID', async () => {
      const mockChain = mockSupabase.from();
      mockChain.eq.mockResolvedValue({
        data: null,
        error: null
      });

      await expect(pmChecklistTemplatesService.deleteTemplate('template-1')).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
    });
  });
});

describe('Helper Functions', () => {
  describe('generateSectionsSummary', () => {
    it('counts items by section', () => {
      const templateData = [
        { id: '1', section: 'Engine', title: 'Item 1', description: '', condition: null, required: false, notes: '' },
        { id: '2', section: 'Engine', title: 'Item 2', description: '', condition: null, required: false, notes: '' },
        { id: '3', section: 'Safety', title: 'Item 3', description: '', condition: null, required: false, notes: '' }
      ];

      const result = generateSectionsSummary(templateData);

      expect(result).toEqual([
        { name: 'Engine', count: 2 },
        { name: 'Safety', count: 1 }
      ]);
    });
  });

  describe('templateToSummary', () => {
    it('converts template to summary format', () => {
      const result = templateToSummary(mockTemplate);

      expect(result).toEqual({
        id: 'template-1',
        name: 'Test Template',
        description: 'Test description',
        is_protected: false,
        organization_id: 'org-1',
        sections: [{ name: 'Engine', count: 1 }],
        itemCount: 1
      });
    });

    it('handles string JSON template_data', () => {
      const templateWithStringData = {
        ...mockTemplate,
        template_data: JSON.stringify([mockChecklistItem])
      } as unknown as PMTemplate;

      const result = templateToSummary(templateWithStringData);

      expect(result.itemCount).toBe(1);
      expect(result.sections).toEqual([{ name: 'Engine', count: 1 }]);
    });

    it('handles malformed template_data', () => {
      const templateWithMalformedData = {
        ...mockTemplate,
        template_data: 'invalid json'
      } as unknown as PMTemplate;

      const result = templateToSummary(templateWithMalformedData);

      expect(result.itemCount).toBe(0);
      expect(result.sections).toEqual([]);
    });
  });
});