import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { TemplateApplicationDialog } from '../TemplateApplicationDialog';
import { TestProviders } from '@/test/utils/TestProviders';

// Mock hooks with named imports
import { usePMTemplate } from '@/hooks/usePMTemplates';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { useCreateWorkOrder } from '@/hooks/useWorkOrderCreation';
import { useSyncEquipmentByOrganization } from '@/services/syncDataService';
import { useInitializePMChecklist } from '@/hooks/useInitializePMChecklist';

vi.mock('@/hooks/usePMTemplates', () => ({
  usePMTemplate: vi.fn(),
}));

vi.mock('@/hooks/useSimpleOrganization', () => ({
  useSimpleOrganization: vi.fn(),
}));

vi.mock('@/hooks/useWorkOrderCreation', () => ({
  useCreateWorkOrder: vi.fn(),
}));

vi.mock('@/services/syncDataService', () => ({
  useSyncEquipmentByOrganization: vi.fn(),
}));

vi.mock('@/hooks/useInitializePMChecklist', () => ({
  useInitializePMChecklist: vi.fn(),
}));

const mockTemplate = {
  id: 'template-1',
  name: 'Forklift PM Template',
  description: 'Standard forklift maintenance',
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

const mockEquipment = [
  {
    id: 'eq-1',
    name: 'Forklift A',
    model: 'Model X',
    serial_number: 'SN001',
    status: 'active'
  },
  {
    id: 'eq-2',
    name: 'Forklift B', 
    model: 'Model Y',
    serial_number: 'SN002',
    status: 'active'
  }
];

const mockHooks = {
  usePMTemplate: {
    data: mockTemplate,
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    status: 'success' as const,
    fetchStatus: 'idle' as const,
    refetch: vi.fn(),
    isRefetching: false,
    isLoadingError: false,
    isRefetchError: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isStale: false
  },
  useSimpleOrganization: {
    currentOrganization: { id: 'org-1', name: 'Test Org' },
    organizations: [],
    userOrganizations: [],
    setCurrentOrganization: vi.fn(),
    isLoading: false,
    error: null,
    switchToOrganization: vi.fn(),
    refreshOrganizations: vi.fn()
  },
  useEquipmentByOrganization: {
    data: mockEquipment,
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    status: 'success' as const,
    fetchStatus: 'idle' as const,
    refetch: vi.fn(),
    isRefetching: false,
    isLoadingError: false,
    isRefetchError: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isStale: false
  },
  useCreateWorkOrder: {
    mutateAsync: vi.fn().mockResolvedValue({ id: 'wo-1' }),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    status: 'idle' as const,
    variables: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
    isIdle: true,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    isPaused: false
  },
  useInitializePMChecklist: {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    status: 'idle' as const,
    variables: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
    isIdle: true,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    isPaused: false
  }
};

describe('TemplateApplicationDialog', () => {
  const defaultProps = {
    templateId: 'template-1',
    open: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks using vi.mocked with proper type casting
    vi.mocked(usePMTemplate).mockReturnValue(mockHooks.usePMTemplate as unknown as ReturnType<typeof usePMTemplate>);
    vi.mocked(useSimpleOrganization).mockReturnValue(mockHooks.useSimpleOrganization as unknown as ReturnType<typeof useSimpleOrganization>);
    vi.mocked(useSyncEquipmentByOrganization).mockReturnValue(mockHooks.useEquipmentByOrganization as unknown as ReturnType<typeof useSyncEquipmentByOrganization>);
    vi.mocked(useCreateWorkOrder).mockReturnValue(mockHooks.useCreateWorkOrder as unknown as ReturnType<typeof useCreateWorkOrder>);
    vi.mocked(useInitializePMChecklist).mockReturnValue(mockHooks.useInitializePMChecklist as unknown as ReturnType<typeof useInitializePMChecklist>);
  });

  describe('Dialog Rendering', () => {
    it('renders dialog with template name in title', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Apply Template: Forklift PM Template')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} open={false} />
        </TestProviders>
      );

      expect(screen.queryByText('Apply Template')).not.toBeInTheDocument();
    });

    it('shows template description', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Standard forklift maintenance')).toBeInTheDocument();
    });

    it('displays equipment list', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Forklift A')).toBeInTheDocument();
      expect(screen.getByText('Forklift B')).toBeInTheDocument();
    });
  });

  describe('Equipment Search and Filtering', () => {
    it('filters equipment by search query', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search by name, model, or serial number...');
      fireEvent.change(searchInput, { target: { value: 'Forklift A' } });

      await waitFor(() => {
        expect(screen.getByText('Forklift A')).toBeInTheDocument();
        expect(screen.queryByText('Forklift B')).not.toBeInTheDocument();
      });
    });

    it('filters by model number', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search by name, model, or serial number...');
      fireEvent.change(searchInput, { target: { value: 'Model X' } });

      await waitFor(() => {
        expect(screen.getByText('Forklift A')).toBeInTheDocument();
        expect(screen.queryByText('Forklift B')).not.toBeInTheDocument();
      });
    });

    it('filters by serial number', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search by name, model, or serial number...');
      fireEvent.change(searchInput, { target: { value: 'SN002' } });

      await waitFor(() => {
        expect(screen.queryByText('Forklift A')).not.toBeInTheDocument();
        expect(screen.getByText('Forklift B')).toBeInTheDocument();
      });
    });
  });

  describe('Equipment Selection', () => {
    it('handles individual equipment selection', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const checkbox = screen.getAllByRole('checkbox')[1]; // First equipment checkbox
      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('handles select all functionality', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      const equipmentCheckboxes = screen.getAllByRole('checkbox').slice(1);
      equipmentCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('updates select all state when individual items are selected', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      const equipmentCheckboxes = screen.getAllByRole('checkbox').slice(1);

      // Select all individual items
      equipmentCheckboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      expect(selectAllCheckbox).toBeChecked();
    });

    it('shows selected equipment count', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Template Application', () => {
    it('applies template to selected equipment', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      // Select equipment
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      // Click create work orders
      const createButton = screen.getByText(/Create \d+ PM Work Order/);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockHooks.useCreateWorkOrder.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Preventative Maintenance'),
            equipmentId: 'eq-1'
          })
        );
      });
    });

    it('initializes PM checklist after work order creation', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

    const createButton = screen.getByText(/Create \d+ PM Work Order/);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockHooks.useInitializePMChecklist.mutateAsync).toHaveBeenCalledWith({
        workOrderId: 'wo-1',
        equipmentId: 'eq-1',
        organizationId: 'org-1',
        templateId: 'template-1'
      });
    });
    });

    it('disables create button when no equipment selected', () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const createButton = screen.getByText(/Create \d+ PM Work Order/);
      expect(createButton).toBeDisabled();
    });

    it('shows loading state during creation', async () => {
      vi.mocked(useCreateWorkOrder).mockReturnValue({
        ...mockHooks.useCreateWorkOrder,
        isPending: true,
        status: 'pending'
      } as unknown as ReturnType<typeof useCreateWorkOrder>);

      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      const createButton = screen.getByText(/Create \d+ PM Work Order/);
      expect(createButton).toBeDisabled();
    });

    it('calls onClose after successful creation', async () => {
      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      const createButton = screen.getByText(/Create \d+ PM Work Order/);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state when template is loading', () => {
      vi.mocked(usePMTemplate).mockReturnValue({
        ...mockHooks.usePMTemplate,
        data: null,
        isLoading: true,
        isSuccess: false,
        status: 'pending'
      } as unknown as ReturnType<typeof usePMTemplate>);

      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Loading template...')).toBeInTheDocument();
    });

    it('shows loading state when equipment is loading', () => {
      vi.mocked(useSyncEquipmentByOrganization).mockReturnValue({
        ...mockHooks.useEquipmentByOrganization,
        data: null,
        isLoading: true,
        isSuccess: false,
        status: 'pending'
      } as unknown as ReturnType<typeof useSyncEquipmentByOrganization>);

      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Loading equipment...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles template not found', () => {
      vi.mocked(usePMTemplate).mockReturnValue({
        ...mockHooks.usePMTemplate,
        data: undefined,
        isLoading: false,
        isSuccess: true,
        status: 'success'
      } as unknown as ReturnType<typeof usePMTemplate>);

      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Template not found')).toBeInTheDocument();
    });

    it('handles no equipment available', () => {
      vi.mocked(useSyncEquipmentByOrganization).mockReturnValue({
        ...mockHooks.useEquipmentByOrganization,
        data: [],
        isLoading: false,
        isSuccess: true,
        status: 'success'
      } as unknown as ReturnType<typeof useSyncEquipmentByOrganization>);

      render(
        <TestProviders>
          <TemplateApplicationDialog {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('0 of 0 equipment selected')).toBeInTheDocument();
    });
  });
});