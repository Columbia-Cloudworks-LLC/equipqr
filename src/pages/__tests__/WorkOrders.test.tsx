import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UseQueryResult } from '@tanstack/react-query';
import WorkOrders from '../WorkOrders';

// Mock all required contexts
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    session: { user: { id: 'user-1' } },
    isLoading: false,
    signUp: vi.fn(),
    signIn: vi.fn(), 
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  }))
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: vi.fn(() => ({
    sessionData: {
      organizations: [],
      currentOrganizationId: 'org-1',
      teamMemberships: []
    },
    isLoading: false,
    error: null,
    refreshSession: vi.fn(),
    clearSession: vi.fn(),
    getCurrentOrganization: vi.fn(),
    switchOrganization: vi.fn(),
    hasTeamRole: vi.fn(() => false),
    hasTeamAccess: vi.fn(() => false),
    canManageTeam: vi.fn(() => false),
    getUserTeamIds: vi.fn(() => [])
  }))
}));

vi.mock('@/contexts/UserContext', () => ({
  useUser: vi.fn(() => ({
    currentUser: { id: 'test-user', email: 'test@test.com', name: 'Test User' },
    isLoading: false,
    setCurrentUser: vi.fn()
  })),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('@/hooks/useTeamMembership', () => ({
  useTeamMembership: vi.fn(() => ({
    teamMemberships: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    hasTeamRole: vi.fn(() => false),
    hasTeamAccess: vi.fn(() => false),
    canManageTeam: vi.fn(() => false),
    getUserTeamIds: vi.fn(() => [])
  }))
}));
import * as useEnhancedWorkOrdersModule from '@/hooks/useEnhancedWorkOrders';
import * as useSimpleOrganizationModule from '@/contexts/SimpleOrganizationContext';
import * as usePermissionsModule from '@/hooks/usePermissions';

// Mock query result type
type MockQueryResult<T> = UseQueryResult<T, Error>;

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

    render(<WorkOrders />);
    
    expect(screen.getByText(/please select an organization/i)).toBeInTheDocument();
  });

  it('displays create work order button for authorized users', () => {
    render(<WorkOrders />);
    
    expect(screen.getByText('Create Work Order')).toBeInTheDocument();
  });

  it('hides create button for unauthorized users', () => {
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
    vi.mocked(useEnhancedWorkOrdersModule.useEnhancedWorkOrders).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      refetch: vi.fn(),
      fetchStatus: 'fetching'
    } as unknown as MockQueryResult<unknown[]>);

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

    vi.mocked(useEnhancedWorkOrdersModule.useEnhancedWorkOrders).mockReturnValue({
      data: mockWorkOrders,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      refetch: vi.fn(),
      fetchStatus: 'idle'
    } as unknown as MockQueryResult<unknown[]>);

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
    vi.mocked(useEnhancedWorkOrdersModule.useEnhancedWorkOrders).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load work orders'),
      isError: true,
      isPending: false,
      isSuccess: false,
      refetch: vi.fn(),
      fetchStatus: 'idle'
    } as unknown as MockQueryResult<unknown[]>);

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