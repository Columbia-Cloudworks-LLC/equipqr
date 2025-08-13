import { vi, beforeEach, describe, it, expect } from 'vitest';
import { createMockSupabaseClient } from '@/test/utils/mock-supabase';

// Mock Supabase with factory function to avoid hoisting issues
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}));

// Import after mock is established
import { 
  pmChecklistTemplatesService, 
  generateSectionsSummary, 
  templateToSummary,
  PMTemplate 
} from '../pmChecklistTemplatesService';
import { PMChecklistItem } from '../preventativeMaintenanceService';

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id')
}));

const mockChecklistItem: PMChecklistItem = {
  id: 'item-1',
  section: 'Engine',
  title: 'Check oil level',
  description: 'Verify oil is at proper level',
  condition: null,
  notes: '',
  required: true
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
  let mockFromChain: any;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create fresh mock client for each test
    mockSupabaseClient = createMockSupabaseClient();
    mockFromChain = mockSupabaseClient.from();
  });

  describe('listTemplates', () => {
    it('fetches templates for organization', async () => {
      // Mock the final result that the chain resolves to
      mockFromChain.order.mockReturnValue({
        ...mockFromChain,
        then: vi.fn().mockResolvedValue({
          data: [mockTemplate],
          error: null
        })
      });

      const result = await pmChecklistTemplatesService.listTemplates('org-1');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(result).toEqual([mockTemplate]);
    });

    it('handles database error', async () => {
      // Mock error case
      mockFromChain.order.mockReturnValue({
        ...mockFromChain,
        then: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      await expect(pmChecklistTemplatesService.listTemplates('org-1')).rejects.toThrow('Database error');
    });
  });

  describe('getTemplate', () => {
    it('fetches single template by ID', async () => {
      mockFromChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const result = await pmChecklistTemplatesService.getTemplate('template-1');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
      expect(result).toEqual(mockTemplate);
    });

    it('returns null when template not found', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      const result = await pmChecklistTemplatesService.getTemplate('template-1');
      
      expect(result).toBeNull();
    });

    it('throws error for other database errors', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Other error' }
      });

      await expect(pmChecklistTemplatesService.getTemplate('template-1'))
        .rejects.toThrow('Other error');
    });
  });

  describe('createTemplate', () => {
    it('creates new template with sanitized data', async () => {
      mockFromChain.single.mockResolvedValue({
        data: { ...mockTemplate, id: 'new-template-id' },
        error: null
      });

      const templateData = {
        organizationId: 'org-1',
        name: 'New Template',
        description: 'Test template',
        template_data: [mockChecklistItem],
        created_by: 'user-1'
      };

      const result = await pmChecklistTemplatesService.createTemplate(templateData);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.insert).toHaveBeenCalled();
      expect(result.id).toBe('new-template-id');
    });

    it('sanitizes template data by clearing condition and notes', async () => {
      const itemWithCondition = {
        ...mockChecklistItem,
        condition: 1 as const,
        notes: 'some notes'
      };

      mockFromChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const templateData = {
        organizationId: 'org-1',
        name: 'Test Template',
        template_data: [itemWithCondition],
        created_by: 'user-1'
      };

      await pmChecklistTemplatesService.createTemplate(templateData);
      
      // Verify the insert call sanitized the data
      const insertCall = mockFromChain.insert.mock.calls[0][0];
      expect(insertCall.template_data[0].condition).toBeNull();
      expect(insertCall.template_data[0].notes).toBe('');
    });
  });

  describe('updateTemplate', () => {
    it('updates template with provided fields', async () => {
      mockFromChain.single.mockResolvedValue({
        data: { ...mockTemplate, name: 'Updated Template' },
        error: null
      });

      const updates = {
        name: 'Updated Template',
        updated_by: 'user-1'
      };

      const result = await pmChecklistTemplatesService.updateTemplate('template-1', updates);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.update).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
      expect(result.name).toBe('Updated Template');
    });

    it('sanitizes template_data when updating', async () => {
      const itemWithCondition = {
        ...mockChecklistItem,
        condition: 1 as const,
        notes: 'some notes'
      };

      mockFromChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const updates = {
        template_data: [itemWithCondition],
        updated_by: 'user-1'
      };

      await pmChecklistTemplatesService.updateTemplate('template-1', updates);
      
      // Verify the update call sanitized the data
      const updateCall = mockFromChain.update.mock.calls[0][0];
      expect(updateCall.template_data[0].condition).toBeNull();
      expect(updateCall.template_data[0].notes).toBe('');
    });
  });

  describe('deleteTemplate', () => {
    it('deletes template by ID', async () => {
      // Mock delete to resolve properly
      mockFromChain.eq.mockReturnValue({
        then: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      await pmChecklistTemplatesService.deleteTemplate('template-1');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.delete).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
    });
  });
});

describe('Helper Functions', () => {
  describe('generateSectionsSummary', () => {
    it('counts items by section', () => {
      const templateData: PMChecklistItem[] = [
        { id: '1', section: 'Engine', title: 'Check oil', description: '', condition: null, notes: '', required: true },
        { id: '2', section: 'Engine', title: 'Check coolant', description: '', condition: null, notes: '', required: true },
        { id: '3', section: 'Safety', title: 'Test brakes', description: '', condition: null, notes: '', required: true }
      ];

      const result = generateSectionsSummary(templateData);
      
      expect(result).toEqual([
        { name: 'Engine', count: 2 },
        { name: 'Safety', count: 1 }
      ]);
    });

    it('handles empty template data', () => {
      const result = generateSectionsSummary([]);
      expect(result).toEqual([]);
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

    it('handles JSON string template_data', () => {
      const templateWithStringData = {
        ...mockTemplate,
        template_data: JSON.stringify([mockChecklistItem]) as unknown as PMChecklistItem[]
      };
      
      const result = templateToSummary(templateWithStringData);
      expect(result.itemCount).toBe(1);
      expect(result.sections).toHaveLength(1);
    });

    it('handles malformed template_data', () => {
      const templateWithBadData = {
        ...mockTemplate,
        template_data: { invalid: 'data' } as unknown as PMChecklistItem[]
      };
      
      const result = templateToSummary(templateWithBadData);
      expect(result.itemCount).toBe(0);
      expect(result.sections).toEqual([]);
    });
  });
});