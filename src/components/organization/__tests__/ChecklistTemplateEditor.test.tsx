import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { ChecklistTemplateEditor } from '../ChecklistTemplateEditor';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks
vi.mock('@/hooks/usePMTemplates', () => ({
  usePMTemplate: vi.fn(),
  useCreatePMTemplate: vi.fn(),
  useUpdatePMTemplate: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockTemplate = {
  id: 'template-1',
  name: 'Test Template',
  description: 'Test description',
  template_data: [
    {
      id: 'item-1',
      section: 'Engine',
      title: 'Check oil level',
      description: 'Verify oil is at proper level',
      condition: null,
      notes: ''
    },
    {
      id: 'item-2',
      section: 'Safety',
      title: 'Test brakes',
      description: 'Ensure brakes function properly',
      condition: null,
      notes: ''
    }
  ]
};

const mockHooks = {
  usePMTemplate: {
    data: mockTemplate,
    isLoading: false
  },
  useCreatePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  },
  useUpdatePMTemplate: {
    mutate: vi.fn(),
    isPending: false
  }
};

describe('ChecklistTemplateEditor', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    templateId: null as string | null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    const { usePMTemplate, useCreatePMTemplate, useUpdatePMTemplate } = require('@/hooks/usePMTemplates');
    
    usePMTemplate.mockReturnValue(mockHooks.usePMTemplate);
    useCreatePMTemplate.mockReturnValue(mockHooks.useCreatePMTemplate);
    useUpdatePMTemplate.mockReturnValue(mockHooks.useUpdatePMTemplate);
  });

  describe('Dialog Rendering', () => {
    it('renders create mode dialog', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Create PM Checklist Template')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
    });

    it('renders edit mode dialog', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      expect(screen.getByText('Edit PM Checklist Template')).toBeInTheDocument();
      expect(screen.getByText('Update Template')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} isOpen={false} />
        </TestProviders>
      );

      expect(screen.queryByText('Create PM Checklist Template')).not.toBeInTheDocument();
    });

    it('populates form with template data in edit mode', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires template name', async () => {
      const { toast } = require('sonner');
      
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Template name is required');
    });

    it('requires at least one section', async () => {
      const { toast } = require('sonner');
      
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('At least one section is required');
    });

    it('requires at least one item in sections', async () => {
      const { toast } = require('sonner');
      
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      // Add a section
      const addSectionButton = screen.getByText('Add Section');
      fireEvent.click(addSectionButton);

      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Each section must have at least one item');
    });

    it('validates item titles are not empty', async () => {
      const { toast } = require('sonner');
      
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      // Add section and item
      const addSectionButton = screen.getByText('Add Section');
      fireEvent.click(addSectionButton);

      const sectionNameInput = screen.getByPlaceholderText('Section name');
      fireEvent.change(sectionNameInput, { target: { value: 'Engine' } });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);

      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('All items must have a title');
    });
  });

  describe('Section Management', () => {
    it('adds new section', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const addSectionButton = screen.getByText('Add Section');
      fireEvent.click(addSectionButton);

      expect(screen.getByPlaceholderText('Section name')).toBeInTheDocument();
    });

    it('renames section', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Engine')).toBeInTheDocument();
      });

      const sectionInput = screen.getByDisplayValue('Engine');
      fireEvent.change(sectionInput, { target: { value: 'Engine Systems' } });

      expect(screen.getByDisplayValue('Engine Systems')).toBeInTheDocument();
    });

    it('deletes section', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Engine')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete section');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Engine')).not.toBeInTheDocument();
      });
    });

    it('expands and collapses sections', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Check oil level')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByLabelText('Toggle section')[0];
      fireEvent.click(expandButton);

      // Section should collapse - items should not be visible
      expect(screen.queryByText('Check oil level')).not.toBeInTheDocument();
    });
  });

  describe('Item Management', () => {
    beforeEach(async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      });
    });

    it('adds new item to section', () => {
      const addItemButtons = screen.getAllByText('Add Item');
      fireEvent.click(addItemButtons[0]);

      expect(screen.getAllByPlaceholderText('Item title')).toHaveLength(3);
    });

    it('edits item title and description', () => {
      const titleInput = screen.getByDisplayValue('Check oil level');
      fireEvent.change(titleInput, { target: { value: 'Check engine oil level' } });

      expect(screen.getByDisplayValue('Check engine oil level')).toBeInTheDocument();
    });

    it('deletes item from section', () => {
      const deleteButtons = screen.getAllByLabelText('Delete item');
      fireEvent.click(deleteButtons[0]);

      expect(screen.queryByDisplayValue('Check oil level')).not.toBeInTheDocument();
    });

    it('reorders items within section', () => {
      const moveUpButtons = screen.getAllByLabelText('Move item up');
      const moveDownButtons = screen.getAllByLabelText('Move item down');
      
      // Should have disabled up button for first item
      expect(moveUpButtons[0]).toBeDisabled();
      // Should have disabled down button for last item in section
      expect(moveDownButtons[0]).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('creates new template successfully', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      // Fill form
      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'New Template' } });

      const descInput = screen.getByPlaceholderText('Enter template description');
      fireEvent.change(descInput, { target: { value: 'New description' } });

      // Add section and item
      const addSectionButton = screen.getByText('Add Section');
      fireEvent.click(addSectionButton);

      const sectionNameInput = screen.getByPlaceholderText('Section name');
      fireEvent.change(sectionNameInput, { target: { value: 'Engine' } });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);

      const itemTitleInput = screen.getByPlaceholderText('Item title');
      fireEvent.change(itemTitleInput, { target: { value: 'Check oil' } });

      // Submit
      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(mockHooks.useCreatePMTemplate.mutate).toHaveBeenCalledWith({
        name: 'New Template',
        description: 'New description',
        template_data: expect.arrayContaining([
          expect.objectContaining({
            section: 'Engine',
            title: 'Check oil',
            description: '',
            condition: null,
            notes: ''
          })
        ])
      });
    });

    it('updates existing template successfully', async () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Template');
      fireEvent.change(nameInput, { target: { value: 'Updated Template' } });

      const saveButton = screen.getByText('Update Template');
      fireEvent.click(saveButton);

      expect(mockHooks.useUpdatePMTemplate.mutate).toHaveBeenCalledWith({
        templateId: 'template-1',
        updates: {
          name: 'Updated Template',
          description: 'Test description',
          template_data: expect.any(Array)
        }
      });
    });

    it('shows loading state during submission', () => {
      const { useCreatePMTemplate } = require('@/hooks/usePMTemplates');
      useCreatePMTemplate.mockReturnValue({
        ...mockHooks.useCreatePMTemplate,
        isPending: true
      });

      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      const saveButton = screen.getByText('Creating...');
      expect(saveButton).toBeDisabled();
    });

    it('calls onClose after successful submission', async () => {
      const { useCreatePMTemplate } = require('@/hooks/usePMTemplates');
      
      // Mock successful creation
      const mockMutate = vi.fn((data, options) => {
        options?.onSuccess?.();
      });

      useCreatePMTemplate.mockReturnValue({
        mutate: mockMutate,
        isPending: false
      });

      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      // Fill minimal form
      const nameInput = screen.getByPlaceholderText('Enter template name');
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const addSectionButton = screen.getByText('Add Section');
      fireEvent.click(addSectionButton);

      const sectionInput = screen.getByPlaceholderText('Section name');
      fireEvent.change(sectionInput, { target: { value: 'Test Section' } });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);

      const itemInput = screen.getByPlaceholderText('Item title');
      fireEvent.change(itemInput, { target: { value: 'Test Item' } });

      const saveButton = screen.getByText('Create Template');
      fireEvent.click(saveButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading when fetching template data', () => {
      const { usePMTemplate } = require('@/hooks/usePMTemplates');
      usePMTemplate.mockReturnValue({
        data: null,
        isLoading: true
      });

      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      expect(screen.getByText('Loading template...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles template not found in edit mode', () => {
      const { usePMTemplate } = require('@/hooks/usePMTemplates');
      usePMTemplate.mockReturnValue({
        data: null,
        isLoading: false
      });

      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} templateId="template-1" />
        </TestProviders>
      );

      expect(screen.getByText('Template not found')).toBeInTheDocument();
    });
  });
});