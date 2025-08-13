import { vi, beforeEach, describe, it, expect } from 'vitest';
import { 
  pmChecklistTemplatesService, 
  generateSectionsSummary, 
  templateToSummary,
  PMTemplate 
} from '../pmChecklistTemplatesService';
import { PMChecklistItem } from '../preventativeMaintenanceService';
import { createMockSupabaseClient } from '@/test/utils/mock-supabase';

// Mock Supabase with the standard mock
const mockSupabase = createMockSupabaseClient();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id')
}));

const mockTemplateData: PMChecklistItem[] = [
  {
    id: 'item-1',
    section: 'Engine',
    title: 'Check oil level',
    description: 'Verify oil is at proper level',
    condition: null,
    notes: '',
    required: true
  },
  {
    id: 'item-2',
    section: 'Engine', 
    title: 'Check coolant',
    description: 'Verify coolant level',
    condition: null,
    notes: '',
    required: true
  },
  {
    id: 'item-3',
    section: 'Safety',
    title: 'Test brakes',
    description: 'Ensure brakes function',
    condition: null,
    notes: '',
    required: true
  }
];

const mockTemplate: PMTemplate = {
  id: 'template-1',
  organization_id: 'org-1',
  name: 'Test Template',
  description: 'Test description',
  is_protected: false,
  template_data: mockTemplateData,
  created_by: 'user-1',
  updated_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const getMockSupabase = () => {
  return mockSupabase;
};

describe('pmChecklistTemplatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('fetches templates for organization', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: [mockTemplate], 
        error: null 
      });

      const result = await pmChecklistTemplatesService.listTemplates('org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.select).toHaveBeenCalledWith('*');
      expect(mockFromChain.or).toHaveBeenCalledWith('organization_id.is.null,organization_id.eq.org-1');
      expect(result).toEqual([mockTemplate]);
    });

    it('handles database error', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      await expect(pmChecklistTemplatesService.listTemplates('org-1'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getTemplate', () => {
    it('fetches single template by ID', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: mockTemplate, 
        error: null 
      });

      const result = await pmChecklistTemplatesService.getTemplate('template-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.select).toHaveBeenCalledWith('*');
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
      expect(mockFromChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });

    it('returns null when template not found', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const result = await pmChecklistTemplatesService.getTemplate('template-1');
      expect(result).toBeNull();
    });

    it('throws error for other database errors', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: new Error('Other error') 
      });

      await expect(pmChecklistTemplatesService.getTemplate('template-1'))
        .rejects.toThrow('Other error');
    });
  });

  describe('createTemplate', () => {
    it('creates new template with sanitized data', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: mockTemplate, 
        error: null 
      });

      const templateData = {
        organizationId: 'org-1',
        name: 'New Template',
        description: 'Test description',
        template_data: mockTemplateData,
        created_by: 'user-1'
      };

      const result = await pmChecklistTemplatesService.createTemplate(templateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.insert).toHaveBeenCalledWith({
        organization_id: 'org-1',
        name: 'New Template',
        description: 'Test description',
        template_data: expect.arrayContaining([
          expect.objectContaining({
            id: 'mock-id',
            condition: null,
            notes: ''
          })
        ]),
        created_by: 'user-1',
        updated_by: 'user-1'
      });
      expect(result).toEqual(mockTemplate);
    });

    it('sanitizes template data by clearing condition and notes', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: mockTemplate, 
        error: null 
      });

      const dirtyTemplateData = [
        {
          id: 'old-id',
          section: 'Engine',
          title: 'Check oil',
          description: 'Check oil level',
          condition: 1 as const,
          notes: 'Previous notes',
          required: true
        }
      ] as PMChecklistItem[];

      await pmChecklistTemplatesService.createTemplate({
        organizationId: 'org-1',
        name: 'Test',
        template_data: dirtyTemplateData,
        created_by: 'user-1'
      });

      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_data: [
            expect.objectContaining({
              id: 'mock-id',
              condition: null,
              notes: ''
            })
          ]
        })
      );
    });
  });

  describe('updateTemplate', () => {
    it('updates template with provided fields', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: mockTemplate, 
        error: null 
      });

      const updates = {
        name: 'Updated Template',
        description: 'Updated description',
        updated_by: 'user-1'
      };

      const result = await pmChecklistTemplatesService.updateTemplate('template-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.update).toHaveBeenCalledWith({
        name: 'Updated Template',
        description: 'Updated description',
        updated_by: 'user-1'
      });
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
      expect(result).toEqual(mockTemplate);
    });

    it('sanitizes template_data when updating', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: mockTemplate, 
        error: null 
      });

      const dirtyData = [
        {
          id: 'item-1',
          section: 'Engine',
          title: 'Check oil',
          description: 'Check oil level',
          condition: 2 as const,
          notes: 'Some notes',
          required: true
        }
      ] as PMChecklistItem[];

      await pmChecklistTemplatesService.updateTemplate('template-1', {
        template_data: dirtyData,
        updated_by: 'user-1'
      });

      expect(mockFromChain.update).toHaveBeenCalledWith({
        template_data: [
          expect.objectContaining({
            condition: null,
            notes: ''
          })
        ],
        updated_by: 'user-1'
      });
    });
  });

  describe('deleteTemplate', () => {
    it('deletes template by ID', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      await pmChecklistTemplatesService.deleteTemplate('template-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('pm_checklist_templates');
      expect(mockFromChain.delete).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'template-1');
    });

    it('throws error on deletion failure', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: new Error('Cannot delete protected template') 
      });

      await expect(pmChecklistTemplatesService.deleteTemplate('template-1'))
        .rejects.toThrow('Cannot delete protected template');
    });
  });

  describe('cloneTemplate', () => {
    it('clones template to target organization', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      
      // Mock getTemplate call
      mockFromChain.single
        .mockResolvedValueOnce({ 
          data: mockTemplate, 
          error: null 
        })
        // Mock insert call
        .mockResolvedValueOnce({ 
          data: { ...mockTemplate, id: 'cloned-template' }, 
          error: null 
        });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      });

      const result = await pmChecklistTemplatesService.cloneTemplate(
        'template-1', 
        'target-org', 
        'Cloned Template'
      );

      expect(mockFromChain.insert).toHaveBeenCalledWith({
        organization_id: 'target-org',
        name: 'Cloned Template',
        description: 'Test description (Cloned)',
        template_data: expect.arrayContaining([
          expect.objectContaining({
            id: 'mock-id',
            condition: null,
            notes: ''
          })
        ]),
        is_protected: false,
        created_by: 'user-1',
        updated_by: 'user-1'
      });

      expect(result).toEqual({ ...mockTemplate, id: 'cloned-template' });
    });

    it('uses default name when newName not provided', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      
      mockFromChain.single
        .mockResolvedValueOnce({ data: mockTemplate, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      });

      await pmChecklistTemplatesService.cloneTemplate('template-1', 'target-org');

      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template (Copy)'
        })
      );
    });

    it('throws error when source template not found', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      await expect(pmChecklistTemplatesService.cloneTemplate('template-1', 'target-org'))
        .rejects.toThrow('Source template not found');
    });

    it('generates fresh IDs for cloned template data', async () => {
      const mockSupabase = getMockSupabase();
      const mockFromChain = mockSupabase.from();
      
      mockFromChain.single
        .mockResolvedValueOnce({ data: mockTemplate, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      });

      await pmChecklistTemplatesService.cloneTemplate('template-1', 'target-org');

      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_data: expect.arrayContaining([
            expect.objectContaining({
              id: 'mock-id'
            })
          ])
        })
      );
    });
  });
});

describe('Helper Functions', () => {
  describe('generateSectionsSummary', () => {
    it('counts items by section', () => {
      const result = generateSectionsSummary(mockTemplateData);
      
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
        sections: [
          { name: 'Engine', count: 2 },
          { name: 'Safety', count: 1 }
        ],
        itemCount: 3
      });
    });

    it('handles JSON string template_data', () => {
      const templateWithStringData = {
        ...mockTemplate,
        template_data: JSON.stringify(mockTemplateData) as unknown as PMChecklistItem[]
      };
      
      const result = templateToSummary(templateWithStringData);
      expect(result.itemCount).toBe(3);
      expect(result.sections).toHaveLength(2);
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

    it('handles invalid JSON string', () => {
      const templateWithInvalidJson = {
        ...mockTemplate,
        template_data: '{ invalid json' as unknown as PMChecklistItem[]
      };
      
      const result = templateToSummary(templateWithInvalidJson);
      expect(result.itemCount).toBe(0);
      expect(result.sections).toEqual([]);
    });
  });
});