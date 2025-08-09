import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkOrders from '../WorkOrders';

// Mock dependencies
vi.mock('@/hooks/useEnhancedWorkOrders', () => ({
  useEnhancedWorkOrders: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/hooks/useSupabaseData', () => ({
  useSyncEquipmentByOrganization: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/contexts/SimpleOrganizationContext', () => ({
  useSimpleOrganization: vi.fn(() => ({
    currentOrganization: {
      id: 'org-1',
      name: 'Test Organization'
    }
  }))
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    canManageWorkOrders: vi.fn(() => true),
    hasRole: vi.fn(() => true)
  }))
}));

vi.mock('@/hooks/useTeams', () => ({
  useTeams: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/components/work-orders/WorkOrderForm', () => ({
  WorkOrderForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="work-order-form">
      <button onClick={onClose}>Close Form</button>
    </div>
  )
}));

describe('WorkOrders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders work orders page title', () => {
    render(<WorkOrders />);
    
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
  });

  it('shows organization selection message when no organization', () => {
    const mockUseSimpleOrganization = require('@/contexts/SimpleOrganizationContext').useSimpleOrganization;
    mockUseSimpleOrganization.mockReturnValue({
      currentOrganization: null
    });

    render(<WorkOrders />);
    
    expect(screen.getByText(/please select an organization/i)).toBeInTheDocument();
  });

  it('displays create work order button for authorized users', () => {
    render(<WorkOrders />);
    
    expect(screen.getByText('Create Work Order')).toBeInTheDocument();
  });

  it('hides create button for unauthorized users', () => {
    const mockUsePermissions = require('@/hooks/usePermissions').usePermissions;
    mockUsePermissions.mockReturnValue({
      canManageWorkOrders: vi.fn(() => false),
      hasRole: vi.fn(() => false)
    });

    render(<WorkOrders />);
    
    expect(screen.queryByText('Create Work Order')).not.toBeInTheDocument();
  });

  it('opens work order form when create button is clicked', async () => {
    render(<WorkOrders />);
    
    const createButton = screen.getByText('Create Work Order');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('work-order-form')).toBeInTheDocument();
    });
  });

  it('closes work order form when close is clicked', async () => {
    render(<WorkOrders />);
    
    // Open form
    const createButton = screen.getByText('Create Work Order');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('work-order-form')).toBeInTheDocument();
    });
    
    // Close form
    const closeButton = screen.getByText('Close Form');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('work-order-form')).not.toBeInTheDocument();
    });
  });

  it('displays loading state correctly', () => {
    const mockUseEnhancedWorkOrders = require('@/hooks/useEnhancedWorkOrders').useEnhancedWorkOrders;
    mockUseEnhancedWorkOrders.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    });

    render(<WorkOrders />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows work orders when data is available', () => {
    const mockWorkOrders = [
      {
        id: 'wo-1',
        title: 'Test Work Order 1',
        status: 'submitted',
        priority: 'high',
        created_date: '2024-01-01'
      },
      {
        id: 'wo-2',
        title: 'Test Work Order 2', 
        status: 'in_progress',
        priority: 'medium',
        created_date: '2024-01-02'
      }
    ];

    const mockUseEnhancedWorkOrders = require('@/hooks/useEnhancedWorkOrders').useEnhancedWorkOrders;
    mockUseEnhancedWorkOrders.mockReturnValue({
      data: mockWorkOrders,
      isLoading: false,
      error: null
    });

    render(<WorkOrders />);
    
    expect(screen.getByText('Test Work Order 1')).toBeInTheDocument();
    expect(screen.getByText('Test Work Order 2')).toBeInTheDocument();
  });

  it('displays empty state when no work orders', () => {
    render(<WorkOrders />);
    
    expect(screen.getByText('No work orders found')).toBeInTheDocument();
    expect(screen.getByText(/get started by creating/i)).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    const mockUseEnhancedWorkOrders = require('@/hooks/useEnhancedWorkOrders').useEnhancedWorkOrders;
    mockUseEnhancedWorkOrders.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load work orders')
    });

    render(<WorkOrders />);
    
    expect(screen.getByText(/error loading work orders/i)).toBeInTheDocument();
  });

  it('includes filter and search functionality', () => {
    render(<WorkOrders />);
    
    expect(screen.getByPlaceholderText(/search work orders/i)).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('allows filtering by status', async () => {
    render(<WorkOrders />);
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('responds to search input', async () => {
    render(<WorkOrders />);
    
    const searchInput = screen.getByPlaceholderText(/search work orders/i);
    fireEvent.change(searchInput, { target: { value: 'maintenance' } });
    
    expect(searchInput).toHaveValue('maintenance');
  });
});