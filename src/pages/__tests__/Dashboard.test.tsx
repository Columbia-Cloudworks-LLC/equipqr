import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UseQueryResult } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import * as useSupabaseDataModule from '@/hooks/useSupabaseData';
import * as useSimpleOrganizationModule from '@/contexts/SimpleOrganizationContext';
import * as usePermissionsModule from '@/hooks/usePermissions';

// Mock query result type
type MockQueryResult<T> = UseQueryResult<T, Error>;

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
  })),
  useEquipmentByOrganization: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
    fetchStatus: 'idle'
  })),
  useDashboardStats: vi.fn(() => ({
    data: {
      totalEquipment: 0,
      activeEquipment: 0,
      maintenanceEquipment: 0,
      totalWorkOrders: 0
    },
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
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>
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
    vi.mocked(useSimpleOrganizationModule.useSimpleOrganization).mockReturnValue({
      organizations: [],
      userOrganizations: [],
      currentOrganization: null,
      setCurrentOrganization: vi.fn(),
      switchOrganization: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn()
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
    vi.mocked(useSupabaseDataModule.useEquipmentByOrganization).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
      refetch: vi.fn(),
      fetchStatus: 'fetching'
    } as unknown as MockQueryResult<unknown[]>);

    render(<Dashboard />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows equipment statistics when data is available', () => {
    vi.mocked(useSupabaseDataModule.useEquipmentByOrganization).mockReturnValue({
      data: [
        { id: '1', status: 'active', name: 'Equipment 1' },
        { id: '2', status: 'maintenance', name: 'Equipment 2' },
        { id: '3', status: 'inactive', name: 'Equipment 3' }
      ],
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      refetch: vi.fn(),
      fetchStatus: 'idle'
    } as unknown as MockQueryResult<unknown[]>);

    render(<Dashboard />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total equipment count
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows work order statistics when data is available', () => {
    // Mock work orders data through enhanced work orders hook instead
    render(<Dashboard />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('handles empty data states gracefully', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('No equipment found')).toBeInTheDocument();
    expect(screen.getByText('No work orders found')).toBeInTheDocument();
  });

  it('displays error states appropriately', () => {
    vi.mocked(useSupabaseDataModule.useEquipmentByOrganization).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load equipment'),
      isError: true,
      isPending: false,
      isSuccess: false,
      refetch: vi.fn(),
      fetchStatus: 'idle'
    } as unknown as MockQueryResult<unknown[]>);

    render(<Dashboard />);
    
    expect(screen.getByText(/error loading equipment/i)).toBeInTheDocument();
  });

  it('shows quick action buttons for users with permissions', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Add Equipment')).toBeInTheDocument();
    expect(screen.getByText('Create Work Order')).toBeInTheDocument();
  });

  it('hides action buttons for users without permissions', () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue({
      canManageTeam: vi.fn(() => false),
      canViewTeam: vi.fn(() => false),
      canCreateTeam: vi.fn(() => false),
      canManageEquipment: vi.fn(() => false),
      canViewEquipment: vi.fn(() => false),
      canCreateEquipment: vi.fn(() => false),
      canUpdateEquipmentStatus: vi.fn(() => false),
      canManageWorkOrder: vi.fn(() => false),
      canViewWorkOrder: vi.fn(() => false),
      canCreateWorkOrder: vi.fn(() => false),
      canAssignWorkOrder: vi.fn(() => false),
      canChangeWorkOrderStatus: vi.fn(() => false),
      canManageOrganization: vi.fn(() => false),
      canInviteMembers: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      isTeamMember: vi.fn(() => false),
      isTeamManager: vi.fn(() => false)
    });

    render(<Dashboard />);
    
    expect(screen.queryByText('Add Equipment')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Work Order')).not.toBeInTheDocument();
  });
});