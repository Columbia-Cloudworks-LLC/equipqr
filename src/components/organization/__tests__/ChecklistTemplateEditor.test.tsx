import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { ChecklistTemplateEditor } from '../ChecklistTemplateEditor';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks
vi.mock('@/hooks/usePMTemplates', () => ({
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
      notes: '',
      required: true
    },
    {
      id: 'item-2',
      section: 'Safety',
      title: 'Test brakes',
      description: 'Ensure brakes function properly',
      condition: null,
      notes: '',
      required: true
    }
  ]
};

const mockHooks = {
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
    template: null as any,
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    const { useCreatePMTemplate, useUpdatePMTemplate } = require('@/hooks/usePMTemplates');
    
    useCreatePMTemplate.mockReturnValue(mockHooks.useCreatePMTemplate);
    useUpdatePMTemplate.mockReturnValue(mockHooks.useUpdatePMTemplate);
  });

  describe('Component Rendering', () => {
    it('renders create mode interface', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByPlaceholderText('Enter template name')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
    });

    it('renders edit mode interface', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} template={mockTemplate} />
        </TestProviders>
      );

      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      expect(screen.getByText('Update Template')).toBeInTheDocument();
    });

    it('populates form with template data in edit mode', () => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} template={mockTemplate} />
        </TestProviders>
      );

      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
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

    it('validates form submission successfully', async () => {
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
  });

  describe('Template Management', () => {
    beforeEach(() => {
      render(
        <TestProviders>
          <ChecklistTemplateEditor {...defaultProps} template={mockTemplate} />
        </TestProviders>
      );
    });

    it('displays existing template data', () => {
      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Check oil level')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test brakes')).toBeInTheDocument();
    });

    it('handles template updates', async () => {
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

    it('calls onSave after successful submission', async () => {
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

      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
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
  });
});