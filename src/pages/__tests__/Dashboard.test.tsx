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
  })),
  useAllWorkOrders: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
    fetchStatus: 'idle'
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
    vi.mocked(useSimpleOrganizationModule.useSimpleOrganization).mockReturnValue({
      organizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      userOrganizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      currentOrganization: { 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      },
      setCurrentOrganization: vi.fn(),
      switchOrganization: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    // Mock dashboard stats
    vi.mocked(useSupabaseDataModule.useDashboardStats).mockReturnValue({
      data: {
        totalEquipment: 10,
        activeEquipment: 8,
        maintenanceEquipment: 2,
        totalWorkOrders: 15
      },
      isLoading: false,
      error: null
    } as unknown as MockQueryResult<any>);

    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back to Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Total Equipment')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    vi.mocked(useSimpleOrganizationModule.useSimpleOrganization).mockReturnValue({
      organizations: [],
      userOrganizations: [],
      currentOrganization: { 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      },
      setCurrentOrganization: vi.fn(),
      switchOrganization: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    // Mock loading stats
    vi.mocked(useSupabaseDataModule.useDashboardStats).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    } as unknown as MockQueryResult<any>);

    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back to Test Organization')).toBeInTheDocument();
    
    // Should show loading cards
    const cards = screen.getAllByRole('generic');
    const loadingCards = cards.filter(card => 
      card.className?.includes('animate-pulse')
    );
    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it('shows equipment statistics when data is available', () => {
    vi.mocked(useSimpleOrganizationModule.useSimpleOrganization).mockReturnValue({
      organizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      userOrganizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      currentOrganization: { 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      },
      setCurrentOrganization: vi.fn(),
      switchOrganization: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    vi.mocked(useSupabaseDataModule.useEquipmentByOrganization).mockReturnValue({
      data: [
        { id: '1', name: 'Equipment 1', status: 'active', manufacturer: 'Test Mfg', model: 'Model 1' },
        { id: '2', name: 'Equipment 2', status: 'maintenance', manufacturer: 'Test Mfg', model: 'Model 2' },
        { id: '3', name: 'Equipment 3', status: 'active', manufacturer: 'Test Mfg', model: 'Model 3' }
      ],
      isLoading: false,
      error: null
    } as unknown as MockQueryResult<any>);

    vi.mocked(useSupabaseDataModule.useDashboardStats).mockReturnValue({
      data: {
        totalEquipment: 3,
        activeEquipment: 2,
        maintenanceEquipment: 1,
        totalWorkOrders: 5
      },
      isLoading: false,
      error: null
    } as unknown as MockQueryResult<any>);

    render(<Dashboard />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Recent Equipment')).toBeInTheDocument();
    expect(screen.getByText('Equipment 1')).toBeInTheDocument();
  });

  it('handles empty data states gracefully', () => {
    vi.mocked(useSimpleOrganizationModule.useSimpleOrganization).mockReturnValue({
      organizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      userOrganizations: [{ 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      }],
      currentOrganization: { 
        id: 'org-1', 
        name: 'Test Organization', 
        memberCount: 5,
        plan: 'free',
        maxMembers: 10,
        features: [],
        userRole: 'admin',
        userStatus: 'active'
      },
      setCurrentOrganization: vi.fn(),
      switchOrganization: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    vi.mocked(useSupabaseDataModule.useEquipmentByOrganization).mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as unknown as MockQueryResult<any>);

    vi.mocked(useSupabaseDataModule.useDashboardStats).mockReturnValue({
      data: {
        totalEquipment: 0,
        activeEquipment: 0,
        maintenanceEquipment: 0,
        totalWorkOrders: 0
      },
      isLoading: false,
      error: null
    } as unknown as MockQueryResult<any>);

    render(<Dashboard />);
    
    expect(screen.getByText('No equipment found')).toBeInTheDocument();
    expect(screen.getByText('No work orders found')).toBeInTheDocument();
  });
});