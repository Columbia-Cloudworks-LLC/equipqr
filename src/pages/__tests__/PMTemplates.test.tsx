import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import PMTemplates from '../PMTemplates';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks with named imports
import { 
  usePMTemplates, 
  usePMTemplate, 
  useCreatePMTemplate, 
  useUpdatePMTemplate, 
  useDeletePMTemplate, 
  useClonePMTemplate 
} from '@/hooks/usePMTemplates';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/utils/simplifiedOrganizationRestrictions';

vi.mock('@/hooks/usePMTemplates', () => ({
  usePMTemplates: vi.fn(),
  usePMTemplate: vi.fn(),
  useCreatePMTemplate: vi.fn(),
  useUpdatePMTemplate: vi.fn(),
  useDeletePMTemplate: vi.fn(),
  useClonePMTemplate: vi.fn(),
}));

vi.mock('@/hooks/useSimpleOrganization', () => ({
  useSimpleOrganization: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('@/utils/simplifiedOrganizationRestrictions', () => ({
  useSimplifiedOrganizationRestrictions: vi.fn(),
}));

// Mock components
vi.mock('@/components/organization/ChecklistTemplateEditor', () => ({
  default: vi.fn(({ isOpen, onClose }) => 
    isOpen ? <div data-testid="template-editor">Template Editor</div> : null
  ),
}));

vi.mock('@/components/pm-templates/TemplateApplicationDialog', () => ({
  default: vi.fn(({ open, onClose }) => 
    open ? <div data-testid="application-dialog">Application Dialog</div> : null
  ),
}));

const mockTemplates = [
  {
    id: 'template-1',
    name: 'Forklift PM (Default)',
    description: 'Standard forklift maintenance checklist',
    is_protected: true,
    organization_id: null,
    sections: [
      { name: 'Engine', count: 5 },
      { name: 'Hydraulics', count: 3 }
    ],
    itemCount: 8
  },
  {
    id: 'template-2',
    name: 'Custom Equipment PM',
    description: 'Organization specific template',
    is_protected: false,
    organization_id: 'org-1',
    sections: [
      { name: 'Safety', count: 4 }
    ],
    itemCount: 4
  }
];

const mockHooks = {
  usePMTemplates: {
    data: mockTemplates,
    isLoading: false,
    error: null
  },
  usePMTemplate: {
    data: null,
    isLoading: false
  },
  useCreatePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  },
  useUpdatePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  },
  useDeletePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  },
  useClonePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  }
};

describe('PMTemplates Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mocks using vi.mocked
    vi.mocked(usePMTemplates).mockReturnValue(mockHooks.usePMTemplates);
    vi.mocked(usePMTemplate).mockReturnValue(mockHooks.usePMTemplate);
    vi.mocked(useCreatePMTemplate).mockReturnValue(mockHooks.useCreatePMTemplate);
    vi.mocked(useUpdatePMTemplate).mockReturnValue(mockHooks.useUpdatePMTemplate);
    vi.mocked(useDeletePMTemplate).mockReturnValue(mockHooks.useDeletePMTemplate);
    vi.mocked(useClonePMTemplate).mockReturnValue(mockHooks.useClonePMTemplate);

    vi.mocked(useSimpleOrganization).mockReturnValue({
      organization: { id: 'org-1', name: 'Test Org' }
    });

    vi.mocked(usePermissions).mockReturnValue({
      isAdmin: true,
      canManageOrganization: true
    });

    vi.mocked(useSimplifiedOrganizationRestrictions).mockReturnValue({
      canCreateCustomTemplates: true,
      hasLicensedUsers: true
    });
  });

  describe('Core Rendering', () => {
    it('renders page title and description', () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('PM Templates')).toBeInTheDocument();
      expect(screen.getByText(/Manage preventative maintenance checklist templates/)).toBeInTheDocument();
    });

    it('shows no organization message when no organization selected', () => {
      vi.mocked(useSimpleOrganization).mockReturnValue({ organization: null });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('No Organization Selected')).toBeInTheDocument();
    });

    it('shows permission denied for non-admin users', () => {
      vi.mocked(usePermissions).mockReturnValue({
        isAdmin: false,
        canManageOrganization: false
      });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    it('displays loading skeleton during data fetch', () => {
      vi.mocked(usePMTemplates).mockReturnValue({
        ...mockHooks.usePMTemplates,
        isLoading: true,
        data: undefined
      });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });
  });

  describe('Template Display', () => {
    it('renders global templates section', () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('Global Templates')).toBeInTheDocument();
      expect(screen.getByText('Forklift PM (Default)')).toBeInTheDocument();
      expect(screen.getByText('Standard forklift maintenance checklist')).toBeInTheDocument();
    });

    it('renders organization templates section for licensed users', () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('Organization Templates')).toBeInTheDocument();
      expect(screen.getByText('Custom Equipment PM')).toBeInTheDocument();
    });

    it('shows upgrade message for unlicensed users', () => {
      vi.mocked(useSimplifiedOrganizationRestrictions).mockReturnValue({
        canCreateCustomTemplates: false,
        hasLicensedUsers: false
      });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText(/Custom PM templates require user licenses/)).toBeInTheDocument();
    });

    it('displays template card with correct data', () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      // Check template name and description
      expect(screen.getByText('Forklift PM (Default)')).toBeInTheDocument();
      expect(screen.getByText('Standard forklift maintenance checklist')).toBeInTheDocument();
      
      // Check sections and item count
      expect(screen.getByText('2 sections')).toBeInTheDocument();
      expect(screen.getByText('8 items')).toBeInTheDocument();
      
      // Check badges
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('Protected')).toBeInTheDocument();
    });
  });

  describe('Template Actions', () => {
    it('handles Apply template button click', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const applyButton = screen.getAllByText('Apply')[0];
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('application-dialog')).toBeInTheDocument();
      });
    });

    it('handles Clone template button click', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const cloneButton = screen.getAllByText('Clone')[0];
      fireEvent.click(cloneButton);

      await waitFor(() => {
        expect(screen.getByText('Clone Template')).toBeInTheDocument();
      });
    });

    it('disables Clone for unlicensed users', () => {
      vi.mocked(useSimplifiedOrganizationRestrictions).mockReturnValue({
        canCreateCustomTemplates: false,
        hasLicensedUsers: false
      });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const cloneButtons = screen.getAllByText('Clone');
      cloneButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('handles Edit template for organization templates', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('template-editor')).toBeInTheDocument();
      });
    });

    it('handles Delete template with confirmation', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete Template');
      fireEvent.click(confirmButton);

      expect(mockHooks.useDeletePMTemplate.mutate).toHaveBeenCalledWith('template-2');
    });
  });

  describe('Template Creation', () => {
    it('opens template editor for new template', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('template-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Clone Dialog', () => {
    it('handles clone name input and submission', async () => {
      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      const cloneButton = screen.getAllByText('Clone')[0];
      fireEvent.click(cloneButton);

      await waitFor(() => {
        expect(screen.getByText('Clone Template')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'New Template Name' } });

      const confirmButton = screen.getByText('Clone Template');
      fireEvent.click(confirmButton);

      expect(mockHooks.useClonePMTemplate.mutate).toHaveBeenCalledWith({
        sourceId: 'template-1',
        newName: 'New Template Name'
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no templates available', () => {
      vi.mocked(usePMTemplates).mockReturnValue({
        ...mockHooks.usePMTemplates,
        data: []
      });

      render(
        <TestProviders>
          <PMTemplates />
        </TestProviders>
      );

      expect(screen.getByText('No templates available')).toBeInTheDocument();
    });
  });
});