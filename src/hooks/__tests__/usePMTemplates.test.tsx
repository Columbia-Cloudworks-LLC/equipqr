import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  usePMTemplates,
  usePMTemplate,
  useCreatePMTemplate,
  useUpdatePMTemplate,
  useDeletePMTemplate,
  useClonePMTemplate
} from '../usePMTemplates';

// Mock dependencies
const mockUseOrganization = vi.fn();
const mockUseAuth = vi.fn();
const mockPmChecklistTemplatesService = {
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  cloneTemplate: vi.fn(),
};
const mockTemplateToSummary = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: mockUseOrganization,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/services/pmChecklistTemplatesService', () => ({
  pmChecklistTemplatesService: mockPmChecklistTemplatesService,
  templateToSummary: mockTemplateToSummary,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

const mockTemplates = [
  {
    id: 'template-1',
    organization_id: null,
    name: 'Global Template',
    description: 'Global template description',
    is_protected: true,
    template_data: [
      { id: 'item-1', section: 'Engine', title: 'Check oil', description: '', condition: null, notes: '' }
    ],
    created_by: 'user-1',
    updated_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-2',
    organization_id: 'org-1',
    name: 'Org Template',
    description: 'Organization template',
    is_protected: false,
    template_data: [
      { id: 'item-2', section: 'Safety', title: 'Check brakes', description: '', condition: null, notes: '' }
    ],
    created_by: 'user-1',
    updated_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockTemplateSummaries = [
  {
    id: 'template-1',
    name: 'Global Template',
    description: 'Global template description',
    is_protected: true,
    organization_id: null,
    sections: [{ name: 'Engine', count: 1 }],
    itemCount: 1
  },
  {
    id: 'template-2',
    name: 'Org Template',
    description: 'Organization template',
    is_protected: false,
    organization_id: 'org-1',
    sections: [{ name: 'Safety', count: 1 }],
    itemCount: 1
  }
];

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('usePMTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-1', name: 'Test Org' }
    });
    
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' }
    });
  });

  describe('usePMTemplates', () => {
    it('fetches and transforms template list', async () => {
      mockPmChecklistTemplatesService.listTemplates.mockResolvedValue(mockTemplates);
      mockTemplateToSummary.mockImplementation((template: typeof mockTemplates[0]) => 
        mockTemplateSummaries.find(s => s.id === template.id)
      );

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPmChecklistTemplatesService.listTemplates).toHaveBeenCalledWith('org-1');
      expect(result.current.data).toEqual(mockTemplateSummaries);
    });

    it('is disabled when no organization is selected', () => {
      mockUseOrganization.mockReturnValue({ currentOrganization: null });

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('handles loading state', () => {
      mockPmChecklistTemplatesService.listTemplates.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('handles error state', async () => {
      mockPmChecklistTemplatesService.listTemplates.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Network error'));
    });
  });

  describe('usePMTemplate', () => {
    it('fetches single template by ID', async () => {
      mockPmChecklistTemplatesService.getTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => usePMTemplate('template-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPmChecklistTemplatesService.getTemplate).toHaveBeenCalledWith('template-1');
      expect(result.current.data).toEqual(mockTemplates[0]);
    });

    it('is disabled when no template ID provided', () => {
      const { result } = renderHook(() => usePMTemplate(''), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreatePMTemplate', () => {
    it('creates new template successfully', async () => {
      mockPmChecklistTemplatesService.createTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      const templateData = {
        name: 'New Template',
        description: 'Test description',
        template_data: [
          { id: 'item-1', section: 'Test', title: 'Test item', description: '', condition: null, notes: '', required: true }
        ]
      };

      await result.current.mutateAsync(templateData);

      expect(mockPmChecklistTemplatesService.createTemplate).toHaveBeenCalledWith({
        organizationId: 'org-1',
        name: 'New Template',
        description: 'Test description',
        template_data: templateData.template_data,
        created_by: 'user-1'
      });

      expect(mockToast.success).toHaveBeenCalledWith('Template created successfully');
    });

    it('handles creation error with permission message', async () => {
      mockPmChecklistTemplatesService.createTemplate.mockRejectedValue(
        new Error('insufficient privileges')
      );

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          name: 'Test',
          template_data: []
        });
      } catch {
        // Expected to throw
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });

    it('handles general creation error', async () => {
      mockPmChecklistTemplatesService.createTemplate.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          name: 'Test',
          template_data: []
        });
      } catch {
        // Expected to throw
      }

      expect(mockToast.error).toHaveBeenCalledWith('Failed to create template');
    });

    it('throws error when organization or user not found', async () => {
      mockUseOrganization.mockReturnValue({ currentOrganization: null });

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: 'Test',
          template_data: []
        })
      ).rejects.toThrow('Organization or user not found');
    });
  });

  describe('useUpdatePMTemplate', () => {
    it('updates template successfully', async () => {
      mockPmChecklistTemplatesService.updateTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => useUpdatePMTemplate(), { wrapper });

      const updates = {
        name: 'Updated Template',
        description: 'Updated description'
      };

      await result.current.mutateAsync({
        templateId: 'template-1',
        updates
      });

      expect(mockPmChecklistTemplatesService.updateTemplate).toHaveBeenCalledWith('template-1', {
        ...updates,
        updated_by: 'user-1'
      });

      expect(mockToast.success).toHaveBeenCalledWith('Template updated successfully');
    });

    it('handles update permission error', async () => {
      mockPmChecklistTemplatesService.updateTemplate.mockRejectedValue(
        new Error('permission denied')
      );

      const { result } = renderHook(() => useUpdatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          templateId: 'template-1',
          updates: { name: 'Test' }
        });
      } catch {
        // Expected to throw
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });
  });

  describe('useDeletePMTemplate', () => {
    it('deletes template successfully', async () => {
      mockPmChecklistTemplatesService.deleteTemplate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePMTemplate(), { wrapper });

      await result.current.mutateAsync('template-1');

      expect(mockPmChecklistTemplatesService.deleteTemplate).toHaveBeenCalledWith('template-1');
      expect(mockToast.success).toHaveBeenCalledWith('Template deleted successfully');
    });

    it('handles protected template deletion error', async () => {
      mockPmChecklistTemplatesService.deleteTemplate.mockRejectedValue(
        new Error('Cannot delete protected template')
      );

      const { result } = renderHook(() => useDeletePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync('template-1');
      } catch {
        // Expected to throw
      }

      expect(mockToast.error).toHaveBeenCalledWith('Cannot delete protected template');
    });
  });

  describe('useClonePMTemplate', () => {
    it('clones template successfully', async () => {
      mockPmChecklistTemplatesService.cloneTemplate.mockResolvedValue(mockTemplates[1]);

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      await result.current.mutateAsync({
        sourceId: 'template-1',
        newName: 'Cloned Template'
      });

      expect(mockPmChecklistTemplatesService.cloneTemplate).toHaveBeenCalledWith(
        'template-1',
        'org-1',
        'Cloned Template'
      );

      expect(mockToast.success).toHaveBeenCalledWith('Template cloned successfully');
    });

    it('handles clone permission error', async () => {
      mockPmChecklistTemplatesService.cloneTemplate.mockRejectedValue(
        new Error('insufficient privileges')
      );

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          sourceId: 'template-1'
        });
      } catch {
        // Expected to throw
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });

    it('throws error when organization not found', async () => {
      mockUseOrganization.mockReturnValue({ currentOrganization: null });

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      await expect(
        result.current.mutateAsync({
          sourceId: 'template-1'
        })
      ).rejects.toThrow('Organization not found');
    });
  });
});