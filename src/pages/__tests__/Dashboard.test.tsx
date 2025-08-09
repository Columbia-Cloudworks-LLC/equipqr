import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';

// Mock dependencies
vi.mock('@/hooks/useSupabaseData', () => ({
  useSyncEquipmentByOrganization: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useSyncWorkOrdersByOrganization: vi.fn(() => ({
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
    canManageEquipment: vi.fn(() => true),
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

// Mock Recharts components
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders organization selection prompt when no organization', () => {
    const mockUseSimpleOrganization = require('@/contexts/SimpleOrganizationContext').useSimpleOrganization;
    mockUseSimpleOrganization.mockReturnValue({
      currentOrganization: null
    });

    render(<Dashboard />);
    
    expect(screen.getByText(/please select an organization/i)).toBeInTheDocument();
  });

  it('renders dashboard content when organization is selected', () => {
    render(<Dashboard />);
    
    // Should show dashboard sections
    expect(screen.getByText('Equipment Overview')).toBeInTheDocument();
    expect(screen.getByText('Work Orders Status')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    const mockUseSyncEquipment = require('@/hooks/useSupabaseData').useSyncEquipmentByOrganization;
    mockUseSyncEquipment.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    });

    render(<Dashboard />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows equipment statistics when data is available', () => {
    const mockUseSyncEquipment = require('@/hooks/useSupabaseData').useSyncEquipmentByOrganization;
    mockUseSyncEquipment.mockReturnValue({
      data: [
        { id: '1', status: 'active', name: 'Equipment 1' },
        { id: '2', status: 'maintenance', name: 'Equipment 2' },
        { id: '3', status: 'inactive', name: 'Equipment 3' }
      ],
      isLoading: false,
      error: null
    });

    render(<Dashboard />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total equipment count
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows work order statistics when data is available', () => {
    const mockUseSyncWorkOrders = require('@/hooks/useSupabaseData').useSyncWorkOrdersByOrganization;
    mockUseSyncWorkOrders.mockReturnValue({
      data: [
        { id: '1', status: 'submitted', title: 'Work Order 1' },
        { id: '2', status: 'in_progress', title: 'Work Order 2' },
        { id: '3', status: 'completed', title: 'Work Order 3' }
      ],
      isLoading: false,
      error: null
    });

    render(<Dashboard />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total work orders count
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('handles empty data states gracefully', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('No equipment found')).toBeInTheDocument();
    expect(screen.getByText('No work orders found')).toBeInTheDocument();
  });

  it('displays error states appropriately', () => {
    const mockUseSyncEquipment = require('@/hooks/useSupabaseData').useSyncEquipmentByOrganization;
    mockUseSyncEquipment.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load equipment')
    });

    render(<Dashboard />);
    
    expect(screen.getByText(/error loading equipment/i)).toBeInTheDocument();
  });

  it('shows quick action buttons for users with permissions', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Add Equipment')).toBeInTheDocument();
    expect(screen.getByText('Create Work Order')).toBeInTheDocument();
  });

  it('hides action buttons for users without permissions', () => {
    const mockUsePermissions = require('@/hooks/usePermissions').usePermissions;
    mockUsePermissions.mockReturnValue({
      canManageEquipment: vi.fn(() => false),
      canManageWorkOrders: vi.fn(() => false),
      hasRole: vi.fn(() => false)
    });

    render(<Dashboard />);
    
    expect(screen.queryByText('Add Equipment')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Work Order')).not.toBeInTheDocument();
  });
});