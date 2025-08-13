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
vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/pmChecklistTemplatesService', () => ({
  pmChecklistTemplatesService: {
    listTemplates: vi.fn(),
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    cloneTemplate: vi.fn(),
  },
  templateToSummary: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
    
    const { useOrganization } = require('@/contexts/OrganizationContext');
    const { useAuth } = require('@/hooks/useAuth');
    
    useOrganization.mockReturnValue({
      currentOrganization: { id: 'org-1', name: 'Test Org' }
    });
    
    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' }
    });
  });

  describe('usePMTemplates', () => {
    it('fetches and transforms template list', async () => {
      const { pmChecklistTemplatesService, templateToSummary } = require('@/services/pmChecklistTemplatesService');
      
      pmChecklistTemplatesService.listTemplates.mockResolvedValue(mockTemplates);
      templateToSummary.mockImplementation((template: any) => 
        mockTemplateSummaries.find(s => s.id === template.id)
      );

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(pmChecklistTemplatesService.listTemplates).toHaveBeenCalledWith('org-1');
      expect(result.current.data).toEqual(mockTemplateSummaries);
    });

    it('is disabled when no organization is selected', () => {
      const { useOrganization } = require('@/contexts/OrganizationContext');
      useOrganization.mockReturnValue({ currentOrganization: null });

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('handles loading state', () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      pmChecklistTemplatesService.listTemplates.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('handles error state', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      pmChecklistTemplatesService.listTemplates.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePMTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Network error'));
    });
  });

  describe('usePMTemplate', () => {
    it('fetches single template by ID', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      pmChecklistTemplatesService.getTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => usePMTemplate('template-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(pmChecklistTemplatesService.getTemplate).toHaveBeenCalledWith('template-1');
      expect(result.current.data).toEqual(mockTemplates[0]);
    });

    it('is disabled when no template ID provided', () => {
      const { result } = renderHook(() => usePMTemplate(''), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreatePMTemplate', () => {
    it('creates new template successfully', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.createTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      const templateData = {
        name: 'New Template',
        description: 'Test description',
        template_data: [
          { id: 'item-1', section: 'Test', title: 'Test item', description: '', condition: null, notes: '', required: true }
        ]
      };

      await result.current.mutateAsync(templateData);

      expect(pmChecklistTemplatesService.createTemplate).toHaveBeenCalledWith({
        organizationId: 'org-1',
        name: 'New Template',
        description: 'Test description',
        template_data: templateData.template_data,
        created_by: 'user-1'
      });

      expect(toast.success).toHaveBeenCalledWith('Template created successfully');
    });

    it('handles creation error with permission message', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.createTemplate.mockRejectedValue(
        new Error('insufficient privileges')
      );

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          name: 'Test',
          template_data: []
        });
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });

    it('handles general creation error', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.createTemplate.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCreatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          name: 'Test',
          template_data: []
        });
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith('Failed to create template');
    });

    it('throws error when organization or user not found', async () => {
      const { useOrganization } = require('@/contexts/OrganizationContext');
      useOrganization.mockReturnValue({ currentOrganization: null });

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
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.updateTemplate.mockResolvedValue(mockTemplates[0]);

      const { result } = renderHook(() => useUpdatePMTemplate(), { wrapper });

      const updates = {
        name: 'Updated Template',
        description: 'Updated description'
      };

      await result.current.mutateAsync({
        templateId: 'template-1',
        updates
      });

      expect(pmChecklistTemplatesService.updateTemplate).toHaveBeenCalledWith('template-1', {
        ...updates,
        updated_by: 'user-1'
      });

      expect(toast.success).toHaveBeenCalledWith('Template updated successfully');
    });

    it('handles update permission error', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.updateTemplate.mockRejectedValue(
        new Error('permission denied')
      );

      const { result } = renderHook(() => useUpdatePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          templateId: 'template-1',
          updates: { name: 'Test' }
        });
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });
  });

  describe('useDeletePMTemplate', () => {
    it('deletes template successfully', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.deleteTemplate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePMTemplate(), { wrapper });

      await result.current.mutateAsync('template-1');

      expect(pmChecklistTemplatesService.deleteTemplate).toHaveBeenCalledWith('template-1');
      expect(toast.success).toHaveBeenCalledWith('Template deleted successfully');
    });

    it('handles protected template deletion error', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.deleteTemplate.mockRejectedValue(
        new Error('Cannot delete protected template')
      );

      const { result } = renderHook(() => useDeletePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync('template-1');
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith('Cannot delete protected template');
    });
  });

  describe('useClonePMTemplate', () => {
    it('clones template successfully', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.cloneTemplate.mockResolvedValue(mockTemplates[1]);

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      await result.current.mutateAsync({
        sourceId: 'template-1',
        newName: 'Cloned Template'
      });

      expect(pmChecklistTemplatesService.cloneTemplate).toHaveBeenCalledWith(
        'template-1',
        'org-1',
        'Cloned Template'
      );

      expect(toast.success).toHaveBeenCalledWith('Template cloned successfully');
    });

    it('handles clone permission error', async () => {
      const { pmChecklistTemplatesService } = require('@/services/pmChecklistTemplatesService');
      const { toast } = require('sonner');
      
      pmChecklistTemplatesService.cloneTemplate.mockRejectedValue(
        new Error('insufficient privileges')
      );

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      try {
        await result.current.mutateAsync({
          sourceId: 'template-1'
        });
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith(
        'Custom PM templates require user licenses. Please upgrade your plan.'
      );
    });

    it('throws error when organization not found', async () => {
      const { useOrganization } = require('@/contexts/OrganizationContext');
      useOrganization.mockReturnValue({ currentOrganization: null });

      const { result } = renderHook(() => useClonePMTemplate(), { wrapper });

      await expect(
        result.current.mutateAsync({
          sourceId: 'template-1'
        })
      ).rejects.toThrow('Organization not found');
    });
  });
});